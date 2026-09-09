import { Router } from "express";
import { randomBytes } from "node:crypto";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import {
  careerSchema,
  enquirySchema,
  subscriberSchema,
} from "../schemas.js";
import { clientIp, makeReference, userAgent } from "../lib/http.js";

/**
 * Public, unauthenticated endpoints used by the website forms.
 *
 * All three are rate limited per IP. The limits are deliberately generous
 * enough that a person filling in a form twice is never blocked, and tight
 * enough that a script is.
 */
export const publicRouter = Router();

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "rate_limited",
    message:
      "You have sent several requests in a short time. Please wait a little, or contact us by telephone or email.",
  },
});

publicRouter.post("/enquiries", formLimiter, async (req, res) => {
  const input = enquirySchema.parse(req.body);

  const enquiry = await prisma.enquiry.create({
    data: {
      reference: makeReference("ENQ"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      matterType: input.matterType,
      description: input.description,
      consent: input.consent,
      consentAt: new Date(),
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
    },
    select: { id: true, reference: true, createdAt: true },
  });

  // Deliberately no enquiry content in the log line.
  logger.info({ reference: enquiry.reference }, "Enquiry received");

  // TODO: notify NOTIFY_EMAIL once a mail provider is configured. Until then
  // enquiries are read from the database / admin portal.

  res.status(201).json({
    reference: enquiry.reference,
    message:
      "Thank you. We aim to acknowledge every enquiry within one working day.",
  });
});

publicRouter.post("/careers", formLimiter, async (req, res) => {
  const input = careerSchema.parse(req.body);

  const application = await prisma.careerApplication.create({
    data: {
      reference: makeReference("APP"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      experience: input.experience,
      enrolment: input.enrolment || null,
      message: input.message,
      consent: input.consent,
      consentAt: new Date(),
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
    },
    select: { reference: true },
  });

  logger.info(
    { reference: application.reference, role: input.role },
    "Career application received",
  );

  res.status(201).json({
    reference: application.reference,
    message:
      "Thank you. Please email your CV quoting this reference so we can consider it alongside your application.",
  });
});

publicRouter.post("/subscribers", formLimiter, async (req, res) => {
  const input = subscriberSchema.parse(req.body);

  const confirmToken = randomBytes(24).toString("hex");

  /**
   * Upsert rather than create: re-subscribing must not 409, and a previously
   * unsubscribed address should be able to come back. Double opt-in means
   * nothing is mailed until confirmedAt is set.
   */
  await prisma.subscriber.upsert({
    where: { email: input.email },
    update: {
      name: input.name || undefined,
      interests: input.interests ?? undefined,
      unsubscribedAt: null,
      confirmToken,
    },
    create: {
      email: input.email,
      name: input.name || null,
      interests: input.interests ?? [],
      confirmToken,
      ipAddress: clientIp(req),
    },
  });

  logger.info("Subscription request received");

  // The same response whether or not the address was already on the list —
  // otherwise this endpoint tells a caller who is subscribed.
  res.status(202).json({
    message:
      "Please check your email and confirm your subscription. You can unsubscribe at any time.",
  });
});
