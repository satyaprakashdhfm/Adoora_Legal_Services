import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { sha256 } from "../lib/crypto.js";
import { clientIp, userAgent } from "../lib/http.js";
import { clearCookie, readCookie, sessionCookie, setCookie } from "../lib/cookies.js";
import type { UserRole } from "../../generated/prisma/client.js";

/**
 * The three signed-in areas. Each has its own sign-in page, its own session
 * cookie and its own sessions, so one person (an owner, say) can be signed in
 * to all three at once in the same browser, and signing out of one leaves
 * the others alone:
 *
 *   admin   /admin    owners, admins, editors
 *   lawyer  /lawyer   lawyers, and owners/admins for the cases assigned to them
 *   client  /dashboard  any client account
 */
export type Area = "admin" | "lawyer" | "client";
export const AREAS: readonly Area[] = ["admin", "lawyer", "client"];

/** Which firm roles may open a staff area. Checked at sign-in and on every request. */
const STAFF_AREA_ROLES: Record<"admin" | "lawyer", readonly UserRole[]> = {
  admin: ["OWNER", "ADMIN", "EDITOR"],
  lawyer: ["LAWYER", "OWNER", "ADMIN"],
};

export function staffAllowed(role: UserRole, area: Area): area is "admin" | "lawyer" {
  return area !== "client" && STAFF_AREA_ROLES[area].includes(role);
}

/** Who is making the request. Staff and clients never share a shape. */
export type Principal =
  | {
      kind: "staff";
      id: string;
      email: string;
      name: string;
      /**
       * The role the request acts with. In the lawyer area this is always
       * LAWYER, whatever the account's own role, so an owner or admin there
       * sees exactly what a lawyer sees: the cases assigned to them.
       */
      role: UserRole;
      area: "admin" | "lawyer";
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
      /** The client's mobile, if they have given one — the dashboard asks for it otherwise. */
      phone?: string | null;
    };

/**
 * Session lifetimes. Staff sessions are a working day, because a staff
 * account can open every case it is assigned; clients get a week, because
 * they visit rarely and see only their own cases.
 */
const STAFF_TTL_SECONDS = 12 * 60 * 60;
const CLIENT_TTL_SECONDS = 7 * 24 * 60 * 60;

/** How stale lastSeenAt may get before a request refreshes it. */
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export async function startSession(
  req: Request,
  res: Response,
  who: { userId: string } | { clientId: string },
  method: "google" | "password" | "otp",
  area: Area,
) {
  const token = randomBytes(32).toString("base64url");
  const ttl = "userId" in who ? STAFF_TTL_SECONDS : CLIENT_TTL_SECONDS;

  await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId: "userId" in who ? who.userId : null,
      clientId: "clientId" in who ? who.clientId : null,
      method,
      area,
      expiresAt: new Date(Date.now() + ttl * 1000),
      ipAddress: clientIp(req),
      userAgent: userAgent(req),
    },
  });

  setCookie(res, sessionCookie(area), token, { maxAgeSeconds: ttl });
}

/** Resolves an area's session cookie to a principal, or null. */
export async function readSession(req: Request, area: Area): Promise<Principal | null> {
  const token = readCookie(req, sessionCookie(area));
  if (!token || token.length > 100) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true, client: true },
  });

  // A session opens only the area it was started in.
  if (!session || session.area !== area || session.revokedAt || session.expiresAt <= new Date()) return null;

  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    // Not awaited: a failed touch must never fail the request.
    prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  if (session.user) {
    // Rechecked every request, so a role change takes effect at once.
    if (!session.user.isActive || !staffAllowed(session.user.role, area)) return null;
    return {
      kind: "staff",
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: area === "lawyer" ? "LAWYER" : session.user.role,
      area,
      avatarUrl: session.user.avatarUrl,
      sessionId: session.id,
    };
  }

  if (session.client && area === "client") {
    if (!session.client.isActive) return null;
    return {
      kind: "client",
      id: session.client.id,
      email: session.client.email,
      name: session.client.name,
      avatarUrl: session.client.avatarUrl,
      sessionId: session.id,
      phone: session.client.phone,
    };
  }

  return null;
}

/** Signs out of one area only. */
export async function endSession(req: Request, res: Response, area: Area) {
  const token = readCookie(req, sessionCookie(area));
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  clearCookie(res, sessionCookie(area));
}

/** Signs an account out everywhere — used when it is deactivated. */
export async function revokeAllSessions(who: { userId: string } | { clientId: string }) {
  await prisma.session.updateMany({
    where: { ...who, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Which area a request acts in. The website's portal pages say so on every
 * call (the `x-adoora-area` header); a plain link such as a document download
 * carries `?area=` instead, and failing both the page it came from decides.
 * A request with none of these acts in no area and is anonymous.
 */
export function requestArea(req: Request): Area | null {
  const header = req.get("x-adoora-area");
  if (header && (AREAS as readonly string[]).includes(header)) return header as Area;

  const query = typeof req.query.area === "string" ? req.query.area : null;
  if (query && (AREAS as readonly string[]).includes(query)) return query as Area;

  const referer = req.get("referer");
  if (referer) {
    try {
      const path = new URL(referer).pathname;
      if (path === "/admin" || path.startsWith("/admin/")) return "admin";
      if (path === "/lawyer" || path.startsWith("/lawyer/")) return "lawyer";
      if (path === "/dashboard" || path.startsWith("/dashboard/")) return "client";
    } catch {
      // Not a URL: no area.
    }
  }
  return null;
}
