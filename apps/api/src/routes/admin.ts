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
import { z } from "zod";
import { addSampleData, removeSampleData, sampleDataStatus, shareCasesForTesting } from "../demo/sample-data.js";
import { audit } from "../lib/audit.js";
import { adminEmails } from "../env.js";
import { revokeAllSessions } from "../auth/session.js";
import { samePhone } from "../auth/msg91.js";

/**
 * A mobile number already on another account of the same kind. Two accounts
 * on one number would each refuse the other's OTP sign-in, so it is refused
 * here instead. (A firm account and a client account may share one.)
 */
async function phoneOnAnother(kind: "user" | "client", phone: string, exceptId?: string) {
  const digits = phone.replace(/\D/g, "");
  const rows =
    kind === "user"
      ? await prisma.user.findMany({ where: { phone: { not: null }, NOT: exceptId ? { id: exceptId } : undefined }, select: { phone: true } })
      : await prisma.client.findMany({ where: { phone: { not: null }, NOT: exceptId ? { id: exceptId } : undefined }, select: { phone: true } });
  return rows.some((row) => samePhone(row.phone, digits));
}
import {
  applicationPatchSchema,
  auditQuerySchema,
  clientCreateSchema,
  clientPatchSchema,
  enquiryPatchSchema,
  searchQuerySchema,
  staffCreateSchema,
  staffPatchSchema,
} from "../portal-schemas.js";
import type { EnquiryStatus, ApplicationStatus, Prisma, UserRole } from "../../generated/prisma/client.js";

/**
 * Admin API, consumed by the console at `/admin` on the website. Cases and
 * documents live on their own routers (they serve every dashboard); this one
 * holds what only the firm's administrators do.
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

/** Counts for the console's overview. */
adminRouter.get(
  "/stats",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (_req, res) => {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const fortnight = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const [
      enquiriesNew,
      enquiriesTotal,
      applicationsNew,
      subscribers,
      casesByStatus,
      queriesOpen,
      clients,
      lawyers,
      upcoming,
      unassigned,
    ] = await Promise.all([
      prisma.enquiry.count({ where: { status: "NEW" } }),
      prisma.enquiry.count(),
      prisma.careerApplication.count({ where: { status: "NEW" } }),
      prisma.subscriber.count({ where: { confirmedAt: { not: null } } }),
      prisma.case.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.clientQuery.count({ where: { status: "OPEN" } }),
      prisma.client.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true, role: "LAWYER" } }),
      prisma.case.findMany({
        where: {
          nextHearingDate: { gte: today, lte: fortnight },
          status: { in: ["ACTIVE", "ON_HOLD", "INTAKE"] },
        },
        orderBy: { nextHearingDate: "asc" },
        take: 10,
        select: {
          reference: true,
          title: true,
          courtName: true,
          caseTypeCode: true,
          caseNumber: true,
          caseYear: true,
          nextHearingDate: true,
          nextHearingPurpose: true,
        },
      }),
      prisma.case.count({
        where: { assignments: { none: {} }, status: { notIn: ["CLOSED", "WITHDRAWN", "DISPOSED"] } },
      }),
    ]);

    res.json({
      enquiries: { new: enquiriesNew, total: enquiriesTotal },
      applications: { new: applicationsNew },
      subscribers: { confirmed: subscribers },
      cases: Object.fromEntries(casesByStatus.map((row) => [row.status, row._count._all])),
      casesUnassigned: unassigned,
      queries: { open: queriesOpen },
      clients,
      lawyers,
      upcomingHearings: upcoming,
    });
  },
);

adminRouter.patch(
  "/enquiries/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const input = enquiryPatchSchema.parse(req.body);
    const id = z.string().uuid().parse(req.params.id);
    const before = await prisma.enquiry.findUnique({ where: { id }, select: { status: true } });
    if (!before) throw new HttpError(404, "Enquiry not found.", "not_found");

    const updated = await prisma.enquiry.update({
      where: { id },
      data: {
        ...input,
        acknowledgedAt:
          input.status === "ACKNOWLEDGED" && before.status === "NEW" ? new Date() : undefined,
      },
    });
    await audit(req, "enquiry.updated", "Enquiry", id, { from: before.status, to: input.status ?? before.status });
    res.json(updated);
  },
);

adminRouter.patch(
  "/applications/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const input = applicationPatchSchema.parse(req.body);
    const id = z.string().uuid().parse(req.params.id);
    const updated = await prisma.careerApplication.update({ where: { id }, data: input });
    await audit(req, "application.updated", "CareerApplication", id, { status: input.status ?? null });
    res.json(updated);
  },
);

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/**
 * Only an OWNER can create, promote to, or change an OWNER or ADMIN. An ADMIN
 * manages lawyers and editors. Nobody can demote or deactivate themselves —
 * that is how a firm locks itself out of its own console.
 */
function assertCanManageRole(actorRole: UserRole, ...roles: (UserRole | undefined)[]) {
  if (actorRole === "OWNER") return;
  if (roles.some((role) => role === "OWNER" || role === "ADMIN")) {
    throw new HttpError(403, "Only an owner can manage owner and admin accounts.", "forbidden");
  }
}

/**
 * GET /api/admin/access — the emails in the server's ADMIN_EMAILS setting.
 * Each becomes an Owner the first time it signs in at /admin/login with
 * Google; `role` is the account it already has, if any. (Everyone else's
 * access is their role on the Team page.)
 */
adminRouter.get("/access", requireAuth, requireRole("OWNER", "ADMIN"), async (_req, res) => {
  const accounts = await prisma.user.findMany({
    where: { email: { in: adminEmails, mode: "insensitive" } },
    select: { email: true, role: true, isActive: true },
  });
  res.json({
    serverEmails: adminEmails.map((email) => {
      const account = accounts.find((a) => a.email?.toLowerCase() === email);
      return { email, role: account?.role ?? null, isActive: account?.isActive ?? null };
    }),
  });
});

adminRouter.get(
  "/users",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const query = searchQuerySchema.parse(req.query);
    const users = await prisma.user.findMany({
      where: {
        ...(query.role ? { role: query.role } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { email: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: query.limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        barEnrolment: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        passwordHash: true,
        googleSub: true,
        _count: { select: { assignments: true } },
        profile: { select: { id: true, slug: true, designation: true, published: true } },
      },
    });

    res.json({
      data: users.map(({ passwordHash, googleSub, ...user }) => ({
        ...user,
        hasPassword: Boolean(passwordHash),
        googleLinked: Boolean(googleSub),
      })),
    });
  },
);

adminRouter.post(
  "/users",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const input = staffCreateSchema.parse(req.body);
    assertCanManageRole(req.auth!.role, input.role);

    // A client account with the same email or number is fine: the two sign in at separate pages.
    if (input.email && (await prisma.user.findUnique({ where: { email: input.email } }))) {
      throw new HttpError(409, "A staff account with that email already exists.", "email_in_use");
    }
    if (await phoneOnAnother("user", input.phone)) {
      throw new HttpError(409, "Someone on the team already has that mobile number.", "phone_in_use");
    }

    // No password: the new member signs in with an OTP on this number, or Google with the email.
    const user = await prisma.user.create({ data: input });
    await audit(req, "user.created", "User", user.id, { role: user.role });
    res.status(201).json({ id: user.id });
  },
);

adminRouter.patch(
  "/users/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const input = staffPatchSchema.parse(req.body);
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, "Staff member not found.", "not_found");

    assertCanManageRole(req.auth!.role, target.role, input.role);

    if (id === req.auth!.sub && (input.isActive === false || (input.role && input.role !== target.role))) {
      throw new HttpError(400, "You cannot change your own role or deactivate yourself.", "self_change");
    }
    if (input.phone && (await phoneOnAnother("user", input.phone, id))) {
      throw new HttpError(409, "Someone on the team already has that mobile number.", "phone_in_use");
    }
    // An email can be added to an account that has none; it is never changed.
    if (input.email) {
      if (target.email) delete input.email;
      else if (await prisma.user.findUnique({ where: { email: input.email } })) {
        throw new HttpError(409, "A staff account with that email already exists.", "email_in_use");
      }
    }

    const updated = await prisma.user.update({ where: { id }, data: input });
    if (input.isActive === false) await revokeAllSessions({ userId: id });

    await audit(req, "user.updated", "User", id, {
      changes: Object.keys(input),
      role: input.role ?? null,
      isActive: input.isActive ?? null,
    });
    res.json({ id: updated.id });
  },
);

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

async function assertCasesExist(caseIds: string[]) {
  if (!caseIds.length) return;
  const found = await prisma.case.count({ where: { id: { in: caseIds } } });
  if (found !== new Set(caseIds).size) {
    throw new HttpError(400, "One of the selected cases no longer exists.", "bad_case");
  }
}

adminRouter.get(
  "/clients",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const query = searchQuerySchema.parse(req.query);
    const clients = await prisma.client.findMany({
      where: {
        AND: [
          query.q
            ? {
                OR: [
                  { name: { contains: query.q, mode: "insensitive" } },
                  { email: { contains: query.q, mode: "insensitive" } },
                  { organisation: { contains: query.q, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      take: query.limit,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        email: true,
        name: true,
        kind: true,
        organisation: true,
        phone: true,
        address: true,
        isActive: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        googleSub: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        cases: {
          select: { case: { select: { id: true, reference: true, title: true, status: true } } },
        },
      },
    });

    res.json({
      data: clients.map(({ googleSub, cases, ...client }) => ({
        ...client,
        googleLinked: Boolean(googleSub),
        cases: cases.map((entry) => entry.case),
      })),
    });
  },
);

adminRouter.post(
  "/clients",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const input = clientCreateSchema.parse(req.body);

    // A firm account with the same email or number is fine: the two sign in at separate pages.
    if (input.email && (await prisma.client.findUnique({ where: { email: input.email } }))) {
      throw new HttpError(409, "A client with that email already exists.", "email_in_use");
    }
    if (await phoneOnAnother("client", input.phone)) {
      throw new HttpError(409, "Another client already has that mobile number.", "phone_in_use");
    }

    const { caseIds = [], ...fields } = input;
    await assertCasesExist(caseIds);

    const client = await prisma.client.create({
      data: {
        ...fields,
        emailVerifiedAt: fields.email ? new Date() : null,
        cases: caseIds.length
          ? { createMany: { data: [...new Set(caseIds)].map((caseId) => ({ caseId })) } }
          : undefined,
      },
    });
    await audit(req, "client.created", "Client", client.id, { caseIds });
    res.status(201).json({ id: client.id });
  },
);

adminRouter.patch(
  "/clients/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const input = clientPatchSchema.parse(req.body);

    const { caseIds, ...fields } = input;
    if (caseIds) await assertCasesExist(caseIds);
    if (fields.phone && (await phoneOnAnother("client", fields.phone, id))) {
      throw new HttpError(409, "Another client already has that mobile number.", "phone_in_use");
    }
    // An email can be added to a client that has none; it is never changed.
    if (fields.email) {
      const current = await prisma.client.findUnique({ where: { id }, select: { email: true } });
      if (current?.email) delete fields.email;
      else if (await prisma.client.findUnique({ where: { email: fields.email } })) {
        throw new HttpError(409, "A client with that email already exists.", "email_in_use");
      }
    }

    // A number the firm types in is not one the client has proven by OTP.
    const before = fields.phone !== undefined ? await prisma.client.findUnique({ where: { id }, select: { phone: true } }) : null;
    const phoneChanged = before !== null && (before.phone ?? "") !== (fields.phone ?? "");
    const updated = await prisma.client
      .update({ where: { id }, data: { ...fields, ...(phoneChanged ? { phoneVerifiedAt: null } : {}) } })
      .catch(() => null);
    if (!updated) throw new HttpError(404, "Client not found.", "not_found");
    if (caseIds) {
      await prisma.$transaction([
        prisma.caseClient.deleteMany({ where: { clientId: id, caseId: { notIn: caseIds } } }),
        prisma.caseClient.createMany({
          data: [...new Set(caseIds)].map((caseId) => ({ caseId, clientId: id })),
          skipDuplicates: true,
        }),
      ]);
    }
    if (input.isActive === false) await revokeAllSessions({ clientId: id });

    await audit(req, "client.updated", "Client", id, { changes: Object.keys(input) });
    res.json({ id });
  },
);

/**
 * Deletes a client account for good: their sign-ins and the queries they
 * raised go with it. Their cases stay with the firm, and files they uploaded
 * stay on those cases.
 */
adminRouter.delete(
  "/clients/:id",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await revokeAllSessions({ clientId: id });
    const deleted = await prisma.client.delete({ where: { id }, select: { name: true } }).catch(() => null);
    if (!deleted) throw new HttpError(404, "Client not found.", "not_found");
    await audit(req, "client.deleted", "Client", null, { id, name: deleted.name });
    res.json({ ok: true });
  },
);

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

adminRouter.get(
  "/audit",
  requireAuth,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    const query = auditQuerySchema.parse(req.query);
    const entries = await prisma.auditLog.findMany({
      where: {
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(query.action ? { action: { startsWith: query.action } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        actor: { select: { name: true, email: true } },
        actorClient: { select: { name: true, email: true } },
      },
    });

    const hasMore = entries.length > query.limit;
    const page = hasMore ? entries.slice(0, query.limit) : entries;
    res.json({ data: page, nextCursor: hasMore ? page[page.length - 1]?.id : null });
  },
);

// ---------------------------------------------------------------------------
// Sample data — fictional records for showing the system (owners only)
// ---------------------------------------------------------------------------

adminRouter.get("/sample-data", requireAuth, requireRole("OWNER"), async (_req, res) => {
  res.json(await sampleDataStatus());
});

adminRouter.post("/sample-data", requireAuth, requireRole("OWNER"), async (req, res) => {
  const result = await addSampleData(typeof req.body?.clientEmail === "string" ? req.body.clientEmail : undefined);
  await audit(req, "sample_data.added", "SampleData", null, result);
  res.status(result.added ? 201 : 200).json(result);
});

/** Gives the sample case to everyone again (after more people are added), and a lawyer and client to any case without one. */
adminRouter.post("/sample-data/share", requireAuth, requireRole("OWNER"), async (req, res) => {
  const result = await shareCasesForTesting();
  await audit(req, "sample_data.shared", "SampleData", null, result);
  res.json(result);
});

adminRouter.delete("/sample-data", requireAuth, requireRole("OWNER"), async (req, res) => {
  const result = await removeSampleData();
  await audit(req, "sample_data.removed", "SampleData", null, result);
  res.json(result);
});
