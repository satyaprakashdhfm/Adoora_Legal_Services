import { Router, type RequestHandler } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import {
  careerSchema,
  enquirySchema,
  subscriberSchema,
} from "../schemas.js";
import { clientIp, HttpError, makeReference, userAgent } from "../lib/http.js";
import { checkUpload } from "../lib/files.js";
import { encryptDocument } from "../lib/crypto.js";
import { storage } from "../storage/index.js";
import { mailApplication, mailEnquiry } from "../lib/mail.js";

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

  mailEnquiry({ reference: enquiry.reference, ...input });

  res.status(201).json({
    reference: enquiry.reference,
    message:
      "Thank you. We aim to acknowledge every enquiry within one working day.",
  });
});

/*
 * A résumé may come with an application: PDF or Word, up to 5 MB. It is
 * checked by its contents (lib/files.ts), encrypted, and stored like a case
 * document; the admin console downloads it from the application.
 */
const RESUME_MAX_MB = 5;
const RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX_MB * 1024 * 1024, files: 1, fields: 15, fieldSize: 8 * 1024 },
});
const resumeMiddleware: RequestHandler = (req, res, next) => {
  resumeUpload.single("resume")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      next(
        error.code === "LIMIT_FILE_SIZE"
          ? new HttpError(413, `Résumés can be up to ${RESUME_MAX_MB} MB.`, "file_too_large")
          : new HttpError(400, "The form could not be read. Please try again.", "bad_upload"),
      );
      return;
    }
    next(error as Error | undefined);
  });
};

async function storeResume(file: Express.Multer.File) {
  const checked = checkUpload(file.originalname, file.buffer);
  if (!checked.ok || !RESUME_TYPES.has(checked.mimeType)) {
    throw new HttpError(415, checked.ok ? "Please attach your résumé as a PDF or Word document." : checked.reason, "file_rejected");
  }
  const encrypted = encryptDocument(file.buffer);
  const key = `careers/${randomUUID()}`;
  await storage.put(key, encrypted.ciphertext, "application/octet-stream");
  return {
    resumeKey: key,
    resumeDriver: storage.name,
    resumeFilename: checked.filename,
    resumeMimeType: checked.mimeType,
    resumeSize: file.size,
    resumeEncKeyId: encrypted.encKeyId,
    resumeWrapKey: encrypted.wrappedKey,
    resumeIv: encrypted.iv,
    resumeAuthTag: encrypted.authTag,
  };
}

publicRouter.post("/careers", formLimiter, resumeMiddleware, async (req, res) => {
  // A multipart form sends every field as text, the consent tick included.
  const body = req.file ? { ...req.body, consent: req.body?.consent === "true" || req.body?.consent === "on" } : req.body;
  const input = careerSchema.parse(body);
  const resume = req.file ? await storeResume(req.file) : null;

  const application = await prisma.careerApplication
    .create({
      data: {
        reference: makeReference("APP"),
        name: input.name,
        email: input.email,
        phone: input.phone,
        role: input.role,
        experience: input.experience || null,
        enrolment: input.enrolment || null,
        message: input.message,
        consent: input.consent,
        consentAt: new Date(),
        ipAddress: clientIp(req),
        userAgent: userAgent(req),
        ...resume,
      },
      select: { reference: true },
    })
    .catch(async (error: unknown) => {
      // The object went in first; without its row nothing would point at it.
      if (resume) await storage.delete(resume.resumeKey).catch(() => undefined);
      throw error;
    });

  logger.info(
    { reference: application.reference, role: input.role, resume: Boolean(resume) },
    "Career application received",
  );
  mailApplication({
    reference: application.reference,
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    enrolment: input.enrolment || null,
    message: input.message,
    hasResume: Boolean(resume),
  });

  res.status(201).json({
    reference: application.reference,
    message: resume
      ? "Thank you. Your application and résumé have reached us."
      : "Thank you. Please email your CV quoting this reference so we can consider it alongside your application.",
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
