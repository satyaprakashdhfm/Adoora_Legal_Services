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
import { endSession, requestArea, staffAllowed, startSession, type Area } from "../auth/session.js";
import { otpWidgetConfig, samePhone, verifyOtpAccessToken, type VerifiedIdentity } from "../auth/msg91.js";
import type { UserRole } from "../../generated/prisma/client.js";
import { PASSWORD_SIGN_IN, SHARED_CASE, TEMP_ACCOUNTS } from "../auth/temp-accounts.js";

/**
 * Three sign-ins, completely independent. Each has its own session and
 * cookie, so one person can be signed in to all three at once:
 *
 *   /admin/login   owners, admins, editors        (audience=admin)  -> /admin
 *   /lawyer/login  lawyers, and owners and admins (audience=lawyer) -> /lawyer
 *   /login         anyone, as a client            (the default)     -> /dashboard
 *
 * The two firm sign-ins admit only people on the Team page, by their
 * registered email (Google, or an emailed code) or registered mobile number
 * (OTP), and only with a role allowed there. In the lawyer area an owner or
 * admin works as a lawyer: the cases assigned to them.
 *
 * The client sign-in admits only clients the firm has added. The same email
 * or number may also belong to a firm account; the page used decides which
 * opens.
 *
 * No account is created by signing in (bar the ADMIN_EMAILS bootstrap, on
 * the console's page): an admin adds it first. A mobile number is checked
 * (`/otp/check`) before the page has MSG91 text it a code.
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

type Audience = Area;

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

authRouter.get("/providers", (_req, res) => {
  res.json({ google: googleEnabled, password: true, otp: otpWidgetConfig() });
});

/** A sign-in check: generous enough for typos, tight enough that numbers cannot be trawled. */
const checkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "rate_limited",
    message: "Too many sign-in attempts. Please try again shortly.",
  },
});

/**
 * The team member a verified number or email signs in on a firm page: on the
 * Team page, with a role allowed there, and active. Throws the reason otherwise.
 */
async function staffForOtp(identity: VerifiedIdentity, audience: "admin" | "lawyer") {
  const select = { id: true, email: true, name: true, role: true, isActive: true, avatarUrl: true, phone: true } as const;
  const matches =
    identity.kind === "email"
      ? await prisma.user.findMany({ where: { email: identity.email }, select })
      : (await prisma.user.findMany({ where: { phone: { not: null } }, select })).filter((u) => samePhone(u.phone, identity.digits));
  const allowed = matches.filter((u) => staffAllowed(u.role, audience));
  if (allowed.length === 0) {
    const code = matches.length ? "not_allowed_here" : "staff_not_registered";
    throw new HttpError(403, code, code);
  }
  if (allowed.length > 1) throw new HttpError(409, "phone_ambiguous", "phone_ambiguous");
  const user = allowed[0]!;
  if (!user.isActive) throw new HttpError(403, "account_inactive", "account_inactive");
  return user;
}

/**
 * The client account a verified number or email opens, matched on what the
 * firm holds for them. A firm account on the same number or email is separate
 * and signs in at its own page.
 */
async function clientForOtp(identity: VerifiedIdentity) {
  const matches =
    identity.kind === "email"
      ? await prisma.client.findMany({ where: { email: identity.email }, select: { id: true, isActive: true } })
      : (await prisma.client.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true, isActive: true } })).filter((c) =>
          samePhone(c.phone, identity.digits),
        );

  // Clients are added by the firm (Admin console → Clients); a number or
  // email it has not added opens nothing, and the page sends them to Contact.
  if (matches.length === 0) throw new HttpError(403, "client_not_registered", "client_not_registered");
  // Two clients on one number: the firm has to say which account it is.
  if (matches.length > 1) throw new HttpError(409, "phone_ambiguous", "phone_ambiguous");
  const client = matches[0]!;
  if (!client.isActive) throw new HttpError(403, "account_inactive", "account_inactive");
  return client;
}

/**
 * POST /api/auth/otp/check — before the page asks MSG91 to text a code: would
 * this number sign in here? An unregistered number gets the same refusal the
 * sign-in would give, and no SMS is sent. `{ ok: true }` otherwise.
 */
authRouter.post("/otp/check", checkLimiter, async (req, res) => {
  const digits = typeof req.body?.phone === "string" ? req.body.phone.replace(/\D/g, "").slice(-10) : "";
  if (!/^[6-9]\d{9}$/.test(digits)) throw new HttpError(400, "otp_send_failed", "otp_send_failed");
  const identity: VerifiedIdentity = { kind: "phone", digits };
  const audience = audienceOf(req.body?.audience);
  if (audience === "client") await clientForOtp(identity);
  else await staffForOtp(identity, audience);
  res.json({ ok: true });
});

/**
 * POST /api/auth/otp — sign-in with a mobile number, verified by the MSG91
 * widget. The body carries the widget's access token, which MSG91 confirms
 * server to server before anything else happens.
 *
 * Only accounts the firm has added are admitted: on the firm's pages a
 * member of the team, on the clients' page a client. The page has already
 * asked `/otp/check`; the verified number is checked again here.
 */
authRouter.post("/otp", loginLimiter, async (req, res) => {
  const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
  if (!accessToken || accessToken.length > 4000) throw new HttpError(400, "otp_invalid", "otp_invalid");

  const identity = await verifyOtpAccessToken(accessToken);
  const audience = audienceOf(req.body?.audience);

  if (audience !== "client") {
    const user = await staffForOtp(identity, audience);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await startSession(req, res, { userId: user.id }, "otp", audience);
    req.principal = {
      kind: "staff",
      id: user.id,
      email: user.email,
      name: user.name,
      role: audience === "lawyer" ? "LAWYER" : user.role,
      area: audience,
      avatarUrl: user.avatarUrl,
      sessionId: null,
    };
    await audit(req, "auth.login", "User", user.id, { method: "otp", area: audience });
    res.json({ redirect: landingFor(audience, safeNext(req.body?.next)) });
    return;
  }

  const client = await clientForOtp(identity);
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: { lastLoginAt: new Date(), phoneVerifiedAt: new Date() },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
  await startSession(req, res, { clientId: updated.id }, "otp", "client");

  req.principal = { kind: "client", id: updated.id, email: updated.email, name: updated.name, avatarUrl: updated.avatarUrl, sessionId: "" };
  await audit(req, "auth.login", "Client", updated.id, { method: "otp" });

  res.json({ redirect: landingFor("client", safeNext(req.body?.next)) });
});

/**
 * POST /api/auth/login {username, password, audience} — the temporary
 * username and password sign-in (auth/temp-accounts.ts). A username works
 * only on its own page: the admin one at the console, the lawyer one at the
 * lawyer workspace, the client one at the client sign-in.
 *
 * The account is found by its email, and created the first time if it is
 * missing; a firm account is never lowered (an owner stays an owner). Each
 * sign-in also puts the person on the shared sample case, if it exists.
 */
const DUMMY_HASH = "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval";

authRouter.post("/login", loginLimiter, async (req, res) => {
  if (!PASSWORD_SIGN_IN) throw new HttpError(404, "Not found.", "not_found");
  const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const audience = audienceOf(req.body?.audience);

  const account = TEMP_ACCOUNTS.find((a) => a.username === username && a.area === audience);
  // Always compare, so the time taken does not reveal which usernames exist.
  const matches = await bcrypt.compare(password, account?.passwordHash ?? DUMMY_HASH);
  if (!account || !matches) {
    logger.warn({ ip: clientIp(req), area: audience }, "Failed username sign-in");
    throw new HttpError(401, "That username or password is not right.", "invalid_credentials");
  }

  const shared = await prisma.case.findUnique({ where: { reference: SHARED_CASE }, select: { id: true } });

  if (account.area === "client") {
    const client =
      (await prisma.client.findUnique({ where: { email: account.email } })) ??
      (await prisma.client.create({ data: { email: account.email, name: account.name, emailVerifiedAt: new Date() } }));
    if (!client.isActive) throw new HttpError(403, "account_inactive", "account_inactive");
    if (shared) await prisma.caseClient.createMany({ data: [{ caseId: shared.id, clientId: client.id }], skipDuplicates: true });
    await prisma.client.update({ where: { id: client.id }, data: { lastLoginAt: new Date() } });
    await startSession(req, res, { clientId: client.id }, "password", "client");
    req.principal = { kind: "client", id: client.id, email: client.email, name: client.name, avatarUrl: client.avatarUrl, sessionId: "" };
    await audit(req, "auth.login", "Client", client.id, { method: "username" });
    res.json({ redirect: landingFor("client", safeNext(req.body?.next)) });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  const user = existing
    ? existing.role === "OWNER" || existing.role === "ADMIN"
      ? existing
      : await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } })
    : await prisma.user.create({ data: { email: account.email, name: account.name, role: "ADMIN" } });
  if (!user.isActive) throw new HttpError(403, "account_inactive", "account_inactive");
  if (shared) await prisma.caseAssignment.createMany({ data: [{ caseId: shared.id, userId: user.id, role: "ASSOCIATE" }], skipDuplicates: true });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(req, res, { userId: user.id }, "password", account.area);
  req.principal = {
    kind: "staff",
    id: user.id,
    email: user.email,
    name: user.name,
    role: account.area === "lawyer" ? "LAWYER" : user.role,
    area: account.area,
    avatarUrl: user.avatarUrl,
    sessionId: null,
  };
  await audit(req, "auth.login", "User", user.id, { method: "username", area: account.area });
  res.json({ redirect: landingFor(account.area, safeNext(req.body?.next)) });
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
    // Owners, admins and editors at the console; lawyers, owners and admins at the lawyers' page.
    if (!staffAllowed(staff.role, audience)) throw new HttpError(403, "not_allowed_here");
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
        // The account's email is proven for the first time. If its number was
        // typed by someone else (an older mobile sign-up), that number stops
        // opening it; the owner is asked for their own.
        ...(client.emailVerifiedAt ? {} : { phone: null, phoneVerifiedAt: null }),
      },
    });
    return { kind: "client", id: client.id };
  }

  // Only clients the firm has added can sign in; nobody signs themselves up.
  throw new HttpError(403, "client_not_registered");
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
      audience,
    );

    req.principal =
      account.kind === "staff" && audience !== "client"
        ? {
            kind: "staff",
            id: account.id,
            email: identity.email,
            name: identity.name,
            role: audience === "lawyer" ? "LAWYER" : account.role,
            area: audience,
            avatarUrl: identity.picture,
            sessionId: null,
          }
        : { kind: "client", id: account.id, email: identity.email, name: identity.name, avatarUrl: identity.picture, sessionId: "" };
    await audit(req, "auth.login", account.kind === "staff" ? "User" : "Client", account.id, { method: "google", area: audience });

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
  const area = req.body?.audience === "lawyer" ? "lawyer" : "admin";
  if (!staffAllowed(user.role, area)) throw new HttpError(403, "This account cannot sign in here.", "not_allowed_here");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession(req, res, { userId: user.id }, "password", area);

  req.principal = { kind: "staff", id: user.id, email: user.email, name: user.name, role: area === "lawyer" ? "LAWYER" : user.role, area, avatarUrl: user.avatarUrl, sessionId: null };
  await audit(req, "auth.login", "User", user.id, { method: "password", area });

  res.json({ redirect: landingFor(area, safeNext(req.body?.next)) });
});

authRouter.post("/logout", async (req: Request, res) => {
  if (req.principal) {
    await audit(req, "auth.logout", req.principal.kind === "staff" ? "User" : "Client", req.principal.id);
  }
  // Only the area the request acts in; the other two stay signed in.
  await endSession(req, res, requestArea(req) ?? "client");
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
      area: principal.kind === "staff" ? principal.area : "client",
      phone: principal.kind === "client" ? principal.phone ?? null : null,
    },
  });
});
