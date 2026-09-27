import { env } from "../env.js";
import { logger } from "../logger.js";
import { HttpError } from "../lib/http.js";

/**
 * MSG91 OTP widget — mobile sign-in for clients.
 *
 * The widget runs in the browser: it takes the number, sends the SMS, checks
 * the code, and hands the page a short-lived access token (a JWT). That token
 * proves nothing on its own until MSG91 confirms it here, server to server,
 * with the account's authkey:
 *
 *   POST https://control.msg91.com/api/v5/widget/verifyAccessToken
 *   { "authkey": MSG91_TOKEN, "access-token": <token from the widget> }
 *   → { "type": "success", "message": "<verified number or email>" }
 *
 * The authkey stays in this process; the browser only ever gets the widget
 * id and the widget's token, which MSG91 designs to be public.
 */

const VERIFY_URL = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

export const otpEnabled = Boolean(env.MSG91_TOKEN && env.MSG91_WIDGET_ID && env.MSG91_WIDGET_TOKEN);

/** The widget settings the sign-in page needs, or null while OTP is off. */
export function otpWidgetConfig() {
  return otpEnabled ? { widgetId: env.MSG91_WIDGET_ID!, tokenAuth: env.MSG91_WIDGET_TOKEN! } : null;
}

export type VerifiedIdentity = { kind: "phone"; digits: string } | { kind: "email"; email: string };

export async function verifyOtpAccessToken(accessToken: string): Promise<VerifiedIdentity> {
  if (!otpEnabled) throw new HttpError(503, "otp_unavailable", "otp_unavailable");

  type Reply = { type?: string; message?: unknown } | null;
  let body: Reply;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ authkey: env.MSG91_TOKEN, "access-token": accessToken }),
      signal: AbortSignal.timeout(15_000),
    });
    body = (await response.json().catch(() => null)) as Reply;
  } catch (error) {
    logger.error({ err: error }, "MSG91 token verification request failed");
    throw new HttpError(502, "otp_failed", "otp_failed");
  }

  if (body?.type !== "success" || typeof body.message !== "string") {
    // The message on failure is MSG91's reason ("invalid token" and the like).
    logger.warn({ type: body?.type, reason: typeof body?.message === "string" ? body.message.slice(0, 120) : null }, "MSG91 rejected an OTP token");
    throw new HttpError(401, "otp_invalid", "otp_invalid");
  }

  const identifier = body.message.trim();
  if (identifier.includes("@")) return { kind: "email", email: identifier.toLowerCase() };
  const digits = identifier.replace(/\D/g, "");
  if (digits.length < 10) {
    logger.error("MSG91 verified a token but returned no usable number");
    throw new HttpError(502, "otp_failed", "otp_failed");
  }
  return { kind: "phone", digits };
}

/**
 * Indian mobile numbers are stored however they were typed — "+91 98480
 * 12345", "098480-12345", "9848012345". Compared on the last ten digits.
 */
export function samePhone(stored: string | null | undefined, digits: string) {
  if (!stored) return false;
  const a = stored.replace(/\D/g, "").slice(-10);
  return a.length === 10 && a === digits.slice(-10);
}
