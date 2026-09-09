import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { listQuerySchema, loginSchema } from "../schemas.js";
import { HttpError, clientIp } from "../lib/http.js";
import {
  requireAuth,
  requireRole,
  signToken,
  type AuthClaims,
} from "../middleware/auth.js";
import type { EnquiryStatus, ApplicationStatus } from "../../generated/prisma/client.js";

/**
 * Admin API. The portal UI is not built yet — these are the endpoints it will
 * consume, and they are complete and usable from a client today.
 */
export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Count only failures, so a legitimate user is not locked out by a typo run.
  skipSuccessfulRequests: true,
  message: {
    error: "rate_limited",
    message: "Too many sign-in attempts. Please try again shortly.",
  },
});

adminRouter.post("/auth/login", loginLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: input.email } });

  /**
   * Always run a bcrypt comparison, even when the user does not exist, so the
   * response time does not reveal which addresses have accounts.
   */
  const hash =
    user?.passwordHash ??
    "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const passwordMatches = await bcrypt.compare(input.password, hash);

  if (!user || !user.isActive || !passwordMatches) {
    logger.warn({ email: input.email, ip: clientIp(req) }, "Failed sign-in");
    throw new HttpError(401, "Incorrect email or password.", "invalid_credentials");
  }

  const claims: AuthClaims = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "auth.login",
        entityType: "User",
        entityId: user.id,
        ipAddress: clientIp(req),
      },
    }),
  ]);

  res.json({
    token: signToken(claims),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

adminRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.auth });
});

adminRouter.get(
  "/enquiries",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const query = listQuerySchema.parse(req.query);

    const enquiries = await prisma.enquiry.findMany({
      where: query.status
        ? { status: query.status as EnquiryStatus }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: query.limit + 1,
      ...(query.cursor
        ? { cursor: { id: query.cursor }, skip: 1 }
        : {}),
    });

    // Reading an enquiry list is itself an auditable event.
    await prisma.auditLog.create({
      data: {
        actorId: req.auth?.sub,
        action: "enquiry.list",
        entityType: "Enquiry",
        metadata: { status: query.status ?? null, count: enquiries.length },
        ipAddress: clientIp(req),
      },
    });

    const hasMore = enquiries.length > query.limit;
    const page = hasMore ? enquiries.slice(0, query.limit) : enquiries;

    res.json({
      data: page,
      nextCursor: hasMore ? page[page.length - 1]?.id : null,
    });
  },
);

adminRouter.get(
  "/applications",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const query = listQuerySchema.parse(req.query);

    const applications = await prisma.careerApplication.findMany({
      where: query.status
        ? { status: query.status as ApplicationStatus }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = applications.length > query.limit;
    const page = hasMore ? applications.slice(0, query.limit) : applications;

    res.json({
      data: page,
      nextCursor: hasMore ? page[page.length - 1]?.id : null,
    });
  },
);

/** Counts for the portal dashboard. */
adminRouter.get(
  "/stats",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (_req, res) => {
    const [enquiriesNew, enquiriesTotal, applicationsNew, subscribers] =
      await Promise.all([
        prisma.enquiry.count({ where: { status: "NEW" } }),
        prisma.enquiry.count(),
        prisma.careerApplication.count({ where: { status: "NEW" } }),
        prisma.subscriber.count({ where: { confirmedAt: { not: null } } }),
      ]);

    res.json({
      enquiries: { new: enquiriesNew, total: enquiriesTotal },
      applications: { new: applicationsNew },
      subscribers: { confirmed: subscribers },
    });
  },
);
