import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { sha256 } from "../lib/crypto.js";
import { clientIp, userAgent } from "../lib/http.js";
import { SESSION_COOKIE, clearCookie, readCookie, setCookie } from "../lib/cookies.js";
import type { UserRole } from "../../generated/prisma/client.js";

/** Who is making the request. Staff and clients never share a shape. */
export type Principal =
  | {
      kind: "staff";
      id: string;
      email: string;
      name: string;
      role: UserRole;
      avatarUrl: string | null;
      sessionId: string | null;
    }
  | {
      kind: "client";
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
      sessionId: string;
    };

/**
 * Session lifetimes. Staff sessions are a working day, because a staff
 * account can open every case it is assigned; clients get a week, because
 * they visit rarely and see only their own matters.
 */
const STAFF_TTL_SECONDS = 12 * 60 * 60;
const CLIENT_TTL_SECONDS = 7 * 24 * 60 * 60;

/** How stale lastSeenAt may get before a request refreshes it. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export async function startSession(
  req: Request,
  res: Response,
  who: { userId: string } | { clientId: string },
  method: "google" | "password",
) {
  const token = randomBytes(32).toString("base64url");
  const ttl = "userId" in who ? STAFF_TTL_SECONDS : CLIENT_TTL_SECONDS;

  await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId: "userId" in who ? who.userId : null,
      clientId: "clientId" in who ? who.clientId : null,
      method,
      expiresAt: new Date(Date.now() + ttl * 1000),
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
    },
  });

  setCookie(res, SESSION_COOKIE, token, { maxAgeSeconds: ttl });
}

/** Resolves the session cookie to a principal, or null. */
export async function readSession(req: Request): Promise<Principal | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || token.length > 100) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true, client: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;

  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    // Not awaited: a failed touch must never fail the request.
    prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  if (session.user) {
    if (!session.user.isActive) return null;
    return {
      kind: "staff",
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      avatarUrl: session.user.avatarUrl,
      sessionId: session.id,
    };
  }

  if (session.client) {
    if (!session.client.isActive) return null;
    return {
      kind: "client",
      id: session.client.id,
      email: session.client.email,
      name: session.client.name,
      avatarUrl: session.client.avatarUrl,
      sessionId: session.id,
    };
  }

  return null;
}

export async function endSession(req: Request, res: Response) {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  clearCookie(res, SESSION_COOKIE);
}

/** Signs an account out everywhere — used when it is deactivated. */
export async function revokeAllSessions(who: { userId: string } | { clientId: string }) {
  await prisma.session.updateMany({
    where: { ...who, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
