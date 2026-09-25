import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { appUrl, jwtSecret } from "../env.js";

/**
 * Cookies are set by the API but belong to the website's origin: the browser
 * reaches the API through the website's `/api/*` rewrite, so from its point
 * of view everything is first-party. That is what lets the session cookie be
 * httpOnly and SameSite=Lax without any third-party-cookie problems.
 */

const secure = appUrl.startsWith("https://");

/**
 * `__Host-` pins the cookie to exactly this host, over HTTPS, at path `/` —
 * it cannot be set or overwritten by a sibling subdomain. Browsers reject the
 * prefix over plain http, so local development uses the bare name.
 */
export const SESSION_COOKIE = secure ? "__Host-als_session" : "als_session";
export const OAUTH_COOKIE = secure ? "__Secure-als_oauth" : "als_oauth";

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function setCookie(
  res: Response,
  name: string,
  value: string,
  options: { maxAgeSeconds: number; path?: string },
) {
  res.cookie(name, value, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: options.path ?? "/",
    maxAge: options.maxAgeSeconds * 1000,
  });
}

export function clearCookie(res: Response, name: string, path = "/") {
  res.clearCookie(name, { httpOnly: true, secure, sameSite: "lax", path });
}

/** HMAC-signed JSON, for the short-lived OAuth state cookie. */
export function signValue(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", jwtSecret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function verifySignedValue<T>(value: string | undefined): T | null {
  if (!value) return null;
  const [body, mac] = value.split(".");
  if (!body || !mac) return null;

  const expected = createHmac("sha256", jwtSecret).update(body).digest();
  const given = Buffer.from(mac, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
