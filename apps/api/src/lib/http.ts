import { randomBytes } from "node:crypto";
import type { Request } from "express";

/**
 * A short, human-quotable reference so a caller can say "I sent enquiry
 * ENQ-2A4F19". Random rather than sequential: a sequential reference leaks
 * how much work the firm is receiving.
 */
export function makeReference(prefix: string): string {
  return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Client IP. Express's `req.ip` respects the `trust proxy` setting, which is
 * configured for Railway's load balancer in app.ts.
 */
export function clientIp(req: Request): string | undefined {
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

export function userAgent(req: Request): string | undefined {
  const value = req.get("user-agent");
  // Truncate: some crawlers send very long UA strings.
  return value ? value.slice(0, 500) : undefined;
}

/** Error type that carries an HTTP status through to the error handler. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
