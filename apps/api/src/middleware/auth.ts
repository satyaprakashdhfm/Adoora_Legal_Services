import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { appUrl, corsOrigins, jwtSecret } from "../env.js";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http.js";
import { readSession, type Principal } from "../auth/session.js";
import type { UserRole } from "../../generated/prisma/client.js";

export type AuthClaims = {
  sub: string;
  email: string;
  role: UserRole;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set for any signed-in caller, staff or client. */
      principal?: Principal;
      /** Staff claims, kept for the original admin endpoints. */
      auth?: AuthClaims;
    }
  }
}

export const TOKEN_TTL = "8h";

export function signToken(claims: AuthClaims): string {
  return jwt.sign(claims, jwtSecret, { expiresIn: TOKEN_TTL });
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Identifies the caller, from either credential the API accepts:
 *
 * - the session cookie, used by the website's dashboards; or
 * - a bearer token from `POST /api/admin/auth/login`, for scripts and API
 *   clients. The token is still checked against the user row, so a
 *   deactivated account stops working at once rather than at expiry.
 *
 * Cookie-authenticated writes must come from the website's own origin. The
 * session cookie is SameSite=Lax, which already keeps it off cross-site
 * POSTs; the Origin check is the second lock on the same door.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.get("authorization");

    if (header?.startsWith("Bearer ")) {
      let claims: AuthClaims;
      try {
        claims = jwt.verify(header.slice(7), jwtSecret) as AuthClaims;
      } catch {
        throw new HttpError(401, "Your session has expired. Please sign in again.", "token_invalid");
      }

      const user = await prisma.user.findUnique({ where: { id: claims.sub } });
      if (!user?.isActive) {
        throw new HttpError(401, "This account is no longer active.", "account_inactive");
      }

      req.principal = {
        kind: "staff",
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        sessionId: null,
      };
    } else {
      const principal = await readSession(req);

      if (principal && !SAFE_METHODS.has(req.method)) {
        const origin = req.get("origin");
        if (!origin || !(origin === appUrl || corsOrigins.includes(origin))) {
          throw new HttpError(403, "This request did not come from the ADOORA website.", "bad_origin");
        }
      }

      if (principal) req.principal = principal;
    }

    if (req.principal?.kind === "staff") {
      req.auth = {
        sub: req.principal.id,
        email: req.principal.email,
        role: req.principal.role,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

/** Any signed-in caller. */
export const requireSignedIn: RequestHandler = (req, _res, next) => {
  next(
    req.principal
      ? undefined
      : new HttpError(401, "Please sign in to continue.", "unauthenticated"),
  );
};

/** Any staff member. Kept under its original name for the admin routes. */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.principal) {
    next(new HttpError(401, "Authentication required.", "unauthenticated"));
    return;
  }
  if (req.principal.kind !== "staff") {
    next(new HttpError(403, "Your account does not have access to this resource.", "forbidden"));
    return;
  }
  next();
};

/** Role gate, applied after `requireAuth`. */
export function requireRole(...roles: UserRole[]): RequestHandler {
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
