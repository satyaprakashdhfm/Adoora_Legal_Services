import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { adminEmails, appUrl, env, googleEnabled } from "../env.js";
import { loginSchema } from "../schemas.js";
import { HttpError, clientIp } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { OAUTH_COOKIE, clearCookie, readCookie, setCookie, signValue, verifySignedValue } from "../lib/cookies.js";
import { beginGoogleSignIn, completeGoogleSignIn, type GoogleIdentity, type OAuthState } from "../auth/google.js";
import { endSession, startSession } from "../auth/session.js";
import type { UserRole } from "../../generated/prisma/client.js";

/**
 * Sign-in for both audiences.
 *
 * One "Continue with Google" button serves staff and clients alike. Which
 * one a Google account becomes is decided here, in this order:
 *
 *   1. an existing staff account with that Google id or email  -> staff
 *   2. an email listed in ADMIN_EMAILS                          -> new OWNER
 *   3. an existing client account                               -> client
 *   4. anyone else                                              -> new client
 *                                                  (if ALLOW_CLIENT_SIGNUP)
 *
 * Staff are never created by signing in (bar the ADMIN_EMAILS bootstrap): an
 * admin adds them by email first. A stranger who signs in therefore gets a
 * client account that can see nothing until the firm links a case to it.
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

function landingFor(kind: "staff" | "client", role: UserRole | null, next: string): string {
  if (kind === "client") {
    // A client following an admin link lands on their own dashboard instead.
    return next && !next.startsWith("/admin") ? next : "/dashboard";
  }
  if (next) return next;
  return role === "OWNER" || role === "ADMIN" ? "/admin" : "/dashboard";
}

function loginError(code: string) {
  return `${appUrl}/login?error=${encodeURIComponent(code)}`;
}

authRouter.get("/providers", (_req, res) => {
  res.json({ google: googleEnabled, password: true });
});

authRouter.get("/google", (req, res) => {
  if (!googleEnabled) {
    res.redirect(302, loginError("google_unavailable"));
    return;
  }

  const { url, state } = beginGoogleSignIn(safeNext(req.query.next));
  setCookie(res, OAUTH_COOKIE, signValue(state), {
    maxAgeSeconds: 10 * 60,
    path: OAUTH_COOKIE_PATH,
  });
  res.redirect(302, url);
});

type Resolved =
  | { kind: "staff"; id: string; role: UserRole }
  | { kind: "client"; id: string };

async function resolveAccount(identity: GoogleIdentity): Promise<Resolved> {
  const now = new Date();

  const staff = await prisma.user.findFirst({
    where: { OR: [{ googleSub: identity.sub }, { email: identity.email }] },
  });

  if (staff) {
    if (!staff.isActive) throw new HttpError(403, "account_inactive");
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

  if (adminEmails.includes(identity.email)) {
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
      data: { googleSub: identity.sub, avatarUrl: identity.picture, lastLoginAt: now },
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
    },
  });
  return { kind: "client", id: created.id };
}

authRouter.get("/google/callback", async (req, res) => {
  const saved = verifySignedValue<OAuthState>(readCookie(req, OAUTH_COOKIE));
  clearCookie(res, OAUTH_COOKIE, OAUTH_COOKIE_PATH);

  if (typeof req.query.error === "string") {
    // The person pressed "Cancel" on Google's screen, most likely.
    res.redirect(302, loginError("google_cancelled"));
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : null;
  if (!googleEnabled || !code || !saved || saved.exp < Date.now() || saved.state !== req.query.state) {
    res.redirect(302, loginError("google_state"));
    return;
  }

  try {
    const identity = await completeGoogleSignIn(code, saved);
    const account = await resolveAccount(identity);

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

    const landing = landingFor(account.kind, account.kind === "staff" ? account.role : null, saved.next);
    res.redirect(302, `${appUrl}${landing}`);
  } catch (error) {
    const code = error instanceof HttpError ? error.message : "google_failed";
    if (!(error instanceof HttpError)) {
      logger.error({ err: error }, "Google sign-in failed");
    } else {
      logger.warn({ code, ip: clientIp(req) }, "Google sign-in refused");
    }
    res.redirect(302, loginError(code));
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

  res.json({ redirect: landingFor("staff", user.role, safeNext(req.body?.next)) });
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
    },
  });
});
