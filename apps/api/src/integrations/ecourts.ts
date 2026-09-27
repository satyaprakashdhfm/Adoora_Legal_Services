import { env } from "../env.js";
import { HttpError } from "../lib/http.js";
import { logger } from "../logger.js";

/**
 * eCourtsIndia partner API client — case detail by CNR only.
 *
 *   GET {ECOURTS_API_URL}/api/partner/case/{cnr}
 *   Authorization: Bearer {ECOURTS_API_KEY}
 *
 * The key stays in this process: it is read from the environment, sent only
 * to eCourtsIndia, and never logged or returned. Upstream failures are
 * translated into the API's own errors, so a caller never sees eCourts'
 * raw error bodies (which could echo request details back).
 *
 * Every call is metered by eCourtsIndia, which is why the route that uses
 * this is staff-only and rate limited.
 */

/** eCourts Case Number Record: 16 letters and digits, e.g. DLND020047882015. */
export const CNR_PATTERN = /^[A-Z0-9]{16}$/;

export function normaliseCnr(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

const TIMEOUT_MS = 20_000;

export type EcourtsCase = {
  /** The case record exactly as eCourtsIndia returns it. */
  data: unknown;
  /** eCourtsIndia's request id — quote it to their support. */
  requestId: string | null;
};

export async function fetchCaseByCnr(cnr: string): Promise<EcourtsCase> {
  if (!env.ECOURTS_API_KEY) {
    throw new HttpError(503, "The eCourts integration is not configured.", "ecourts_unconfigured");
  }

  const url = `${env.ECOURTS_API_URL.replace(/\/$/, "")}/api/partner/case/${encodeURIComponent(cnr)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.ECOURTS_API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = (error as Error).name === "TimeoutError";
    logger.error({ cnr, timedOut, err: timedOut ? undefined : error }, "eCourts request failed");
    throw new HttpError(
      504,
      timedOut ? "eCourts took too long to respond. Please try again." : "Could not reach eCourts. Please try again.",
      "ecourts_unreachable",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { data?: unknown; meta?: { request_id?: string } }
    | null;
  const requestId = body?.meta?.request_id ?? null;

  if (response.ok) {
    if (!body || body.data === undefined) {
      logger.error({ cnr, requestId }, "eCourts returned an unexpected body");
      throw new HttpError(502, "eCourts returned a response we could not read.", "ecourts_bad_response");
    }
    return { data: body.data, requestId };
  }

  logger.warn({ cnr, status: response.status, requestId }, "eCourts lookup refused");

  switch (response.status) {
    case 404:
      throw new HttpError(404, "eCourts has no case with that CNR, or it is not indexed yet.", "ecourts_not_found");
    case 429:
      throw new HttpError(429, "Too many eCourts lookups right now. Please wait a moment and try again.", "ecourts_rate_limited");
    case 402:
      // The firm's eCourts account is out of credits — an operator problem.
      throw new HttpError(503, "eCourts lookups are unavailable at the moment. Please contact the administrator.", "ecourts_no_credits");
    case 401:
    case 403:
      // Bad or revoked key. Say so in the log, not to the caller.
      logger.error({ status: response.status, requestId }, "eCourts rejected the API key — check ECOURTS_API_KEY");
      throw new HttpError(503, "eCourts lookups are unavailable at the moment. Please contact the administrator.", "ecourts_auth_failed");
    default:
      throw new HttpError(502, "eCourts could not return this case. Please try again.", "ecourts_error");
  }
}

/**
 * Asks eCourtsIndia to re-scrape a case from the eCourts source:
 *
 *   POST {ECOURTS_API_URL}/api/partner/case/{cnr}/refresh   → 202 QUEUED
 *
 * Asynchronous — the fresh data is readable with `fetchCaseByCnr` some 5–10
 * seconds later. Repeats within 15 seconds are idempotent on their side.
 *
 * Never throws: if the refresh cannot be queued, the caller still reads the
 * record eCourtsIndia already has, which is better than failing the check.
 * Returns whether it was queued.
 */
export async function queueCaseRefresh(cnr: string): Promise<boolean> {
  if (!env.ECOURTS_API_KEY) return false;
  const url = `${env.ECOURTS_API_URL.replace(/\/$/, "")}/api/partner/case/${encodeURIComponent(cnr)}/refresh`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.ECOURTS_API_KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as { meta?: { request_id?: string } } | null;
    if (response.ok) return true;
    logger.warn({ cnr, status: response.status, requestId: body?.meta?.request_id ?? null }, "eCourts refresh not queued");
    return false;
  } catch (error) {
    logger.warn({ cnr, err: error }, "eCourts refresh request failed");
    return false;
  }
}
