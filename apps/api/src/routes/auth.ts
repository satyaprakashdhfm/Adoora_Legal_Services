import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { adminEmails, appUrl, env, googleEnabled } from "../env.js";
import { loginSchema } from "../schemas.js";
import { HttpError, clientIp } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { z } from "zod";
import { OAUTH_COOKIE, clearCookie, readCookie, setCookie, signValue, verifySignedValue } from "../lib/cookies.js";
import { beginGoogleSignIn, completeGoogleSignIn, type GoogleIdentity, type OAuthState } from "../auth/google.js";
import { endSession, startSession } from "../auth/session.js";
import { otpWidgetConfig, samePhone, verifyOtpAccessToken } from "../auth/msg91.js";
import type { UserRole } from "../../generated/prisma/client.js";

/**
 * Three sign-ins, kept completely apart:
 *
 *   /admin/login   owners, admins, editors  (?audience=admin)  -> /admin
 *   /lawyer/login  lawyers                  (?audience=lawyer) -> /lawyer
 *   /login         clients                  (the default)      -> /dashboard
 *
 * Each page looks only at its own kind of account. The same email may have a
 * firm account and a client account; which one opens depends only on the
 * page used. A lawyer is sent to their own page from the console's, and an
 * owner or admin the other way.
 *
 * Firm accounts are never created by signing in (bar the ADMIN_EMAILS
 * bootstrap, on the console's page): an admin adds them by email first.
 */
export const authRouter = Router();

const OAUTH_COOKIE_PATH = "/api/auth";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: "rate_limited",
    message: "Too many sign-in attempts. Please try again shortly.",
  },
});

/** Only same-site paths, so the sign-in cannot be used as an open redirect. */
function safeNext(value: unknown): string {
  if (typeof value !== "string") return "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "";
  return value.slice(0, 300);
}

type Audience = "admin" | "lawyer" | "client";

function audienceOf(value: unknown): Audience {
  return value === "admin" || value === "staff" ? "admin" : value === "lawyer" ? "lawyer" : "client";
}

const HOME: Record<Audience, string> = { admin: "/admin", lawyer: "/lawyer", client: "/dashboard" };
const LOGIN_PAGE: Record<Audience, string> = { admin: "/admin/login", lawyer: "/lawyer/login", client: "/login" };

/** Where to go after signing in: the `next` page if it is in this area, else the area's home. */
function landingFor(audience: Audience, next: string): string {
  const home = HOME[audience];
  return next === home || next.startsWith(`${home}/`) ? next : home;
}

function loginError(code: string, audience: Audience = "client") {
  return `${appUrl}${LOGIN_PAGE[audience]}?error=${encodeURIComponent(code)}`;
}

/** Which firm page a staff role signs in at. */
const staffAudience = (role: UserRole): Audience => (role === "LAWYER" ? "lawyer" : "admin");

authRouter.get("/providers", (_req, res) => {
  res.json({ google: googleEnabled, password: true, otp: otpWidgetConfig() });
});

/**
 * POST /api/auth/otp — client sign-in with a mobile number, verified by the
 * MSG91 widget. The body carries the widget's access token, which MSG91
 * confirms server to server before anything else happens.
 *
 * Only existing client accounts are admitted, matched on the phone number
 * the firm holds for them: a Client needs an email, which a phone number
 * alone cannot give, so new clients still join through Google. A number that
 * belongs to a firm account is sent to the console's sign-in instead.
 */
authRouter.post("/otp", loginLimiter, async (req, res) => {
  const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
  if (!accessToken || accessToken.length > 4000) throw new HttpError(400, "otp_invalid", "otp_invalid");

  const identity = await verifyOtpAccessToken(accessToken);

  // Client accounts only: a firm account on the same number or email is
  // separate and signs in at its own page.
  const matches =
    identity.kind === "email"
      ? await prisma.client.findMany({ where: { email: identity.email }, select: { id: true, isActive: true } })
      : (await prisma.client.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true, isActive: true } })).filter((c) =>
          samePhone(c.phone, identity.digits),
        );

  if (matches.length === 0) {
    // A new number: offer sign-up. The verified number travels in a signed,
    // short-lived token, so the sign-up step cannot swap in another number.
    if (identity.kind !== "phone" || !env.ALLOW_CLIENT_SIGNUP) {
      throw new HttpError(404, "phone_not_registered", "phone_not_registered");
    }
    const phone = identity.digits.slice(-10);
    res.json({
      needsSignup: true,
      phone: `+91 ${phone}`,
      signupToken: signValue({ purpose: "otp-signup", phone, exp: Date.now() + 15 * 60 * 1000 }),
    });
    return;
  }
  // Two clients on one number: the firm has to say which account it is.
  if (matches.length > 1) throw new HttpError(409, "phone_ambiguous", "phone_ambiguous");
  const client = matches[0]!;
  if (!client.isActive) throw new HttpError(403, "account_inactive", "account_inactive");

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: { lastLoginAt: new Date(), phoneVerifiedAt: new Date() },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
  await startSession(req, res, { clientId: updated.id }, "otp");

  req.principal = { kind: "client", id: updated.id, email: updated.email, name: updated.name, avatarUrl: updated.avatarUrl, sessionId: "" };
  await audit(req, "auth.login", "Client", updated.id, { method: "otp" });

  res.json({ redirect: landingFor("client", safeNext(req.body?.next)) });
});

const signupSchema = z.object({
  signupToken: z.string().min(10).max(2000),
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200),
  next: z.string().optional(),
});

/** Is this number already on another client account? (A firm account may share it.) */
async function phoneTaken(digits: string, exceptClientId?: string) {
  const clients = await prisma.client.findMany({
    where: { phone: { not: null }, NOT: exceptClientId ? { id: exceptClientId } : undefined },
    select: { phone: true },
  });
  return clients.some((row) => samePhone(row.phone, digits));
}

/**
 * POST /api/auth/otp/signup — a new client after a mobile OTP: the verified
 * number (from the signed token) plus the name and email they type.
 *
 * The email is unproven — OTP proves only the phone — so it is stored as
 * unverified until the person signs in with Google once. An email already on
 * an account is refused rather than attached, so nobody can take over an
 * account by typing its address.
 */
authRouter.post("/otp/signup", loginLimiter, async (req, res) => {
  const input = signupSchema.parse(req.body);
  const token = verifySignedValue<{ purpose?: string; phone?: string; exp?: number }>(input.signupToken);
  if (!token || token.purpose !== "otp-signup" || !token.phone || !token.exp || token.exp < Date.now()) {
    throw new HttpError(400, "signup_expired", "signup_expired");
  }
  if (!env.ALLOW_CLIENT_SIGNUP) throw new HttpError(403, "signup_closed", "signup_closed");

  const existing = await prisma.client.findFirst({ where: { email: input.email }, select: { id: true } });
  if (existing) throw new HttpError(409, "email_taken", "email_taken");
  if (await phoneTaken(token.phone)) throw new HttpError(409, "phone_ambiguous", "phone_ambiguous");

  const now = new Date();
  const client = await prisma.client.create({
    data: { email: input.email, name: input.name, phone: `+91 ${token.phone}`, phoneVerifiedAt: now, lastLoginAt: now },
    select: { id: true, email: true, name: true, avatarUrl: true, phone: true },
  });
  await startSession(req, res, { clientId: client.id }, "otp");

  req.principal = { kind: "client", id: client.id, email: client.email, name: client.name, avatarUrl: client.avatarUrl, sessionId: "", phone: client.phone };
  await audit(req, "auth.signup", "Client", client.id, { method: "otp" });

  res.status(201).json({ redirect: landingFor("client", safeNext(input.next)) });
});

/**
 * POST /api/auth/me/phone — a signed-in client adds (or changes) their
 * mobile, proven by an MSG91 OTP token. Typically after a Google sign-in.
 */
authRouter.post("/me/phone", loginLimiter, async (req, res) => {
  const principal = req.principal;
  if (!principal || principal.kind !== "client") throw new HttpError(401, "Please sign in.", "unauthenticated");
  const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
  if (!accessToken || accessToken.length > 4000) throw new HttpError(400, "otp_invalid", "otp_invalid");

  const identity = await verifyOtpAccessToken(accessToken);
  if (identity.kind !== "phone") throw new HttpError(400, "otp_invalid", "otp_invalid");
  const digits = identity.digits.slice(-10);
  if (await phoneTaken(digits, principal.id)) throw new HttpError(409, "phone_in_use", "phone_in_use");

  const updated = await prisma.client.update({
    where: { id: principal.id },
    data: { phone: `+91 ${digits}`, phoneVerifiedAt: new Date() },
    select: { phone: true },
  });
  await audit(req, "client.phone_verified", "Client", principal.id);
  res.json({ phone: updated.phone });
});

authRouter.get("/google", (req, res) => {
  if (!googleEnabled) {
    res.redirect(302, loginError("google_unavailable"));
    return;
  }

  const audience = audienceOf(req.query.audience);
  const { url, state } = beginGoogleSignIn(safeNext(req.query.next), audience);
  setCookie(res, OAUTH_COOKIE, signValue(state), {
    maxAgeSeconds: 10 * 60,
    path: OAUTH_COOKIE_PATH,
  });
  res.redirect(302, url);
});

type Resolved =
  | { kind: "staff"; id: string; role: UserRole }
  | { kind: "client"; id: string };

async function resolveAccount(identity: GoogleIdentity, audience: Audience): Promise<Resolved> {
  const now = new Date();

  if (audience === "client") return resolveClient(identity, now);

  const staff = await prisma.user.findFirst({
    where: { OR: [{ googleSub: identity.sub }, { email: identity.email }] },
  });

  if (staff) {
    if (!staff.isActive) throw new HttpError(403, "account_inactive");
    // Lawyers at their page, owners/admins/editors at the console's.
    if (staffAudience(staff.role) !== audience) {
      throw new HttpError(403, audience === "admin" ? "use_lawyer_login" : "use_admin_login");
    }
    // An email already linked to a different Google account is not taken over.
    if (staff.googleSub && staff.googleSub !== identity.sub) {
      throw new HttpError(403, "account_mismatch");
    }
    await prisma.user.update({
      where: { id: staff.id },
      data: { googleSub: identity.sub, avatarUrl: identity.picture, lastLoginAt: now },
    });
    return { kind: "staff", id: staff.id, role: staff.role };
  }

  if (audience === "admin" && adminEmails.includes(identity.email)) {
    const owner = await prisma.user.create({
      data: {
        email: identity.email,
        name: identity.name,
        googleSub: identity.sub,
        avatarUrl: identity.picture,
        role: "OWNER",
        lastLoginAt: now,
      },
    });
    logger.info({ userId: owner.id }, "Bootstrapped owner account from ADMIN_EMAILS");
    return { kind: "staff", id: owner.id, role: owner.role };
  }

  // The firm's pages do not create or admit client accounts.
  throw new HttpError(403, "not_staff");
}

/** The clients' page: client accounts only, whatever firm account shares the email. */
async function resolveClient(identity: GoogleIdentity, now: Date): Promise<Resolved> {
  const client = await prisma.client.findFirst({
    where: { OR: [{ googleSub: identity.sub }, { email: identity.email }] },
  });

  if (client) {
    if (!client.isActive) throw new HttpError(403, "account_inactive");
    if (client.googleSub && client.googleSub !== identity.sub) {
      throw new HttpError(403, "account_mismatch");
    }
    await prisma.client.update({
      where: { id: client.id },
      data: {
        googleSub: identity.sub,
        avatarUrl: identity.picture,
        lastLoginAt: now,
        emailVerifiedAt: client.emailVerifiedAt ?? now,
        // The account's email is proven for the first time. If it was created
        // by mobile sign-up, whoever typed this email may not be its owner,
        // so their number stops opening it; the owner is asked for their own.
        ...(client.emailVerifiedAt ? {} : { phone: null, phoneVerifiedAt: null }),
      },
    });
    return { kind: "client", id: client.id };
  }

  if (!env.ALLOW_CLIENT_SIGNUP) throw new HttpError(403, "signup_closed");

  const created = await prisma.client.create({
    data: {
      email: identity.email,
      name: identity.name,
      googleSub: identity.sub,
      avatarUrl: identity.picture,
      lastLoginAt: now,
      emailVerifiedAt: now,
    },
  });
  return { kind: "client", id: created.id };
}

authRouter.get("/google/callback", async (req, res) => {
  const saved = verifySignedValue<OAuthState>(readCookie(req, OAUTH_COOKIE));
  clearCookie(res, OAUTH_COOKIE, OAUTH_COOKIE_PATH);

  if (typeof req.query.error === "string") {
    // The person pressed "Cancel" on Google's screen, most likely.
    res.redirect(302, loginError("google_cancelled", audienceOf(saved?.audience)));
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : null;
  if (!googleEnabled || !code || !saved || saved.exp < Date.now() || saved.state !== req.query.state) {
    res.redirect(302, loginError("google_state", audienceOf(saved?.audience)));
    return;
  }

  try {
    const identity = await completeGoogleSignIn(code, saved);
    const audience = audienceOf(saved.audience);
    const account = await resolveAccount(identity, audience);

    await startSession(
      req,
      res,
      account.kind === "staff" ? { userId: account.id } : { clientId: account.id },
      "google",
    );

    req.principal =
      account.kind === "staff"
        ? { kind: "staff", id: account.id, email: identity.email, name: identity.name, role: account.role, avatarUrl: identity.picture, sessionId: null }
        : { kind: "client", id: account.id, email: identity.email, name: identity.name, avatarUrl: identity.picture, sessionId: "" };
    await audit(req, "auth.login", account.kind === "staff" ? "User" : "Client", account.id, { method: "google" });

    const landing = landingFor(audience, saved.next);
    res.redirect(302, `${appUrl}${landing}`);
  } catch (error) {
    const code = error instanceof HttpError ? error.message : "google_failed";
    if (!(error instanceof HttpError)) {
      logger.error({ err: error }, "Google sign-in failed");
    } else {
      logger.warn({ code, ip: clientIp(req) }, "Google sign-in refused");
    }
    res.redirect(302, loginError(code, audienceOf(saved.audience)));
  }
});

/**
 * Staff password sign-in, for accounts that have a password (the seeded
 * owner). Kept alongside Google so the console is reachable before the
 * Google client is configured, and if Google is ever unavailable.
 */
authRouter.post("/password", loginLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Always run a comparison so timing does not reveal which emails exist.
  const hash =
    user?.passwordHash ??
    "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
  const matches = await bcrypt.compare(input.password, hash);

  if (!user || !user.isActive || !user.passwordHash || !matches) {
    logger.warn({ ip: clientIp(req) }, "Failed password sign-in");
    throw new HttpError(401, "Incorrect email or password.", "invalid_credentials");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(req, res, { userId: user.id }, "password");

  req.principal = { kind: "staff", id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl, sessionId: null };
  await audit(req, "auth.login", "User", user.id, { method: "password" });

  res.json({ redirect: landingFor(staffAudience(user.role), safeNext(req.body?.next)) });
});

authRouter.post("/logout", async (req: Request, res) => {
  if (req.principal) {
    await audit(req, "auth.logout", req.principal.kind === "staff" ? "User" : "Client", req.principal.id);
  }
  await endSession(req, res);
  res.json({ ok: true });
});

/** The signed-in account, or `{ user: null }` — never a 401, so pages can ask freely. */
authRouter.get("/me", (req, res) => {
  const principal = req.principal;
  res.set("Cache-Control", "no-store");

  if (!principal) {
    res.json({ user: null });
    return;
  }

  res.json({
    user: {
      kind: principal.kind,
      id: principal.id,
      email: principal.email,
      name: principal.name,
      avatarUrl: principal.avatarUrl,
      role: principal.kind === "staff" ? principal.role : null,
      phone: principal.kind === "client" ? principal.phone ?? null : null,
    },
  });
});
