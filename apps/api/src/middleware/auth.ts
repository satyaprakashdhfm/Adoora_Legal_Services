import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../env.js";
import { HttpError } from "../lib/http.js";

export type AuthClaims = {
  sub: string;
  email: string;
  role: "OWNER" | "ADMIN" | "EDITOR";
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

export const TOKEN_TTL = "8h";

export function signToken(claims: AuthClaims): string {
  return jwt.sign(claims, jwtSecret, { expiresIn: TOKEN_TTL });
}

/**
 * Bearer-token auth for the admin endpoints.
 *
 * Tokens are short-lived and stateless. When the admin portal lands, this is
 * the point at which to add refresh tokens and a revocation list — a stateless
 * token cannot be withdrawn before it expires.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required.", "unauthenticated"));
    return;
  }

  try {
    const claims = jwt.verify(header.slice(7), jwtSecret) as AuthClaims;
    req.auth = claims;
    next();
  } catch {
    next(
      new HttpError(401, "Your session has expired. Please sign in again.", "token_invalid"),
    );
  }
};

/** Role gate, applied after `requireAuth`. */
export function requireRole(...roles: AuthClaims["role"][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new HttpError(401, "Authentication required.", "unauthenticated"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(
        new HttpError(
          403,
          "Your account does not have access to this resource.",
          "forbidden",
        ),
      );
      return;
    }

    next();
  };
}
