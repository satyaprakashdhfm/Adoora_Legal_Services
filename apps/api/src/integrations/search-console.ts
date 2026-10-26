import { env } from "../env.js";
import { logger } from "../logger.js";
import { googleAccessToken, serviceAccount, serviceAccountProblem } from "./google-service-account.js";

/**
 * Google Search Console, read-only, for the console's SEO page: for each
 * published article, how often Google showed it, how often it was clicked,
 * its average position (overall and per search typed), and whether Google
 * has it in its index yet.
 *
 * Signs in as the service account (google-service-account.ts), which must be
 * a user on the site's property. The property is SEARCH_CONSOLE_SITE if set,
 * otherwise the one the account can see for APP_URL's domain (a domain
 * property first: it covers www and bare, http and https).
 *
 * Free. Search analytics allows 1,200 queries a minute and URL inspection
 * 2,000 a day per property; the report and the inspections are cached, so
 * opening the page often costs a sliver of that.
 */

const API = "https://searchconsole.googleapis.com";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const ORIGIN = new URL(env.APP_URL).origin;
const DOMAIN = new URL(env.APP_URL).hostname.replace(/^www\./, "");
const REPORT_TTL_MS = 30 * 60_000;
const INSPECT_TTL_MS = 6 * 3_600_000;
const INSPECT_MIN_GAP_MS = 10 * 60_000;

type Result<T> = { ok: true; data: T } | { ok: false; reason: string };
type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function call<T>(method: "GET" | "POST", path: string, body?: object): Promise<Result<T>> {
  const key = serviceAccount();
  if (!key) return { ok: false, reason: serviceAccountProblem() ?? "The Google service account is not configured." };
  try {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${await googleAccessToken(SCOPE)}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    if (!response.ok) {
      const message = String(data.error?.message ?? "");
      // Google's 403 covers two different fixes and names neither, so both are said in full.
      const reason =
        response.status === 403 && /has not been used|is disabled/i.test(message)
          ? "The Search Console API is turned off in the Google Cloud project. Enable it under APIs & Services."
          : response.status === 403
            ? `Search Console refused access. Add ${key.client_email} as a user on the ${DOMAIN} property.`
            : message || `Search Console answered ${response.status}.`;
      return { ok: false, reason };
    }
    return { ok: true, data: data as T };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    return { ok: false, reason: name === "TimeoutError" ? "Search Console timed out." : error instanceof Error ? error.message : String(error) };
  }
}

let siteFound: string | null = null;

async function findSite(): Promise<Result<string>> {
  if (env.SEARCH_CONSOLE_SITE) return { ok: true, data: env.SEARCH_CONSOLE_SITE };
  if (siteFound) return { ok: true, data: siteFound };
  const result = await call<{ siteEntry?: { siteUrl: string; permissionLevel: string }[] }>("GET", "/webmasters/v3/sites");
  if (!result.ok) return result;
  const sites = (result.data.siteEntry ?? []).filter((site) => site.permissionLevel !== "siteUnverifiedUser").map((site) => site.siteUrl);
  const pick =
    sites.find((site) => site === `sc-domain:${DOMAIN}`) ??
    sites.find((site) => site === `https://www.${DOMAIN}/`) ??
    sites.find((site) => site.includes(DOMAIN));
  if (!pick) return { ok: false, reason: `No Search Console property for ${DOMAIN} is shared with ${serviceAccount()?.client_email}.` };
  siteFound = pick;
  return { ok: true, data: pick };
}

const sitePath = (site: string) => encodeURIComponent(site);

async function searchAnalytics(site: string, body: object): Promise<Result<Row[]>> {
  const result = await call<{ rows?: Row[] }>("POST", `/webmasters/v3/sites/${sitePath(site)}/searchAnalytics/query`, body);
  return result.ok ? { ok: true, data: result.data.rows ?? [] } : result;
}

export type IndexStatus = { verdict: string; coverage: string; lastCrawl: string | null };

async function inspectUrl(site: string, url: string): Promise<Result<IndexStatus>> {
  const result = await call<{ inspectionResult?: { indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string } } }>(
    "POST",
    "/v1/urlInspection/index:inspect",
    { inspectionUrl: url, siteUrl: site, languageCode: "en-IN" },
  );
  if (!result.ok) return result;
  const status = result.data.inspectionResult?.indexStatusResult ?? {};
  return {
    ok: true,
    data: { verdict: status.verdict ?? "VERDICT_UNSPECIFIED", coverage: status.coverageState ?? "", lastCrawl: status.lastCrawlTime ?? null },
  };
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export type SeoQuery = { query: string; clicks: number; impressions: number; position: number };

export type SeoPage = {
  path: string;
  clicks: number;
  impressions: number;
  /** Average position across every search it was shown for; null when never shown. */
  position: number | null;
  /** The searches it was shown for, most shown first (top 50). */
  queries: SeoQuery[];
  /** URL Inspection, or null when the check did not answer. */
  index: IndexStatus | null;
};

export type SeoReport = {
  connected: boolean;
  problem: string | null;
  site: string | null;
  days: number;
  from: string;
  to: string;
  totals: { clicks: number; impressions: number; position: number | null } | null;
  pages: SeoPage[];
  generatedAt: string;
};

/** A URL Google reports as one of our paths: no host, query or trailing slash. */
function pathOf(url: string) {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return url;
  }
}

/**
 * Google reports one page under every address it has seen it at (www or
 * bare, http or https, with or without a trailing slash). Those fold into
 * one row: clicks and impressions summed, position averaged by impressions.
 */
function fold(rows: { clicks: number; impressions: number; position: number }[]) {
  let clicks = 0;
  let impressions = 0;
  let weighted = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
    weighted += row.position * row.impressions;
  }
  return { clicks, impressions, position: impressions ? weighted / impressions : null };
}

const istDay = (msAgo: number) => new Date(Date.now() + 5.5 * 3_600_000 - msAgo).toISOString().slice(0, 10);

const reportCache = new Map<string, { at: number; report: SeoReport }>();
const inspectCache = new Map<string, { at: number; value: IndexStatus }>();

async function indexStatus(site: string, path: string, fresh: boolean): Promise<IndexStatus | null> {
  const hit = inspectCache.get(path);
  if (hit && Date.now() - hit.at < (fresh ? INSPECT_MIN_GAP_MS : INSPECT_TTL_MS)) return hit.value;
  const result = await inspectUrl(site, `${ORIGIN}${path}`);
  if (!result.ok) {
    logger.warn({ path, reason: result.reason }, "Search Console inspection failed");
    return hit?.value ?? null;
  }
  inspectCache.set(path, { at: Date.now(), value: result.data });
  return result.data;
}

export async function seoReport(paths: string[], days: number, { fresh = false } = {}): Promise<SeoReport> {
  const from = istDay((days - 1) * 86_400_000);
  const to = istDay(0);
  const empty = (problem: string, site: string | null = null): SeoReport => ({
    connected: false,
    problem,
    site,
    days,
    from,
    to,
    totals: null,
    pages: [],
    generatedAt: new Date().toISOString(),
  });

  if (!serviceAccount()) return empty(serviceAccountProblem() ?? "The Google service account is not configured.");

  const cacheKey = `${days}|${paths.join(",")}`;
  const cached = reportCache.get(cacheKey);
  if (!fresh && cached && Date.now() - cached.at < REPORT_TTL_MS) return cached.report;

  const site = await findSite();
  if (!site.ok) return empty(site.reason);

  // dataState "all" includes the last two days, which Google marks as not
  // final: slightly provisional numbers beat a page always three days behind.
  const range = { startDate: from, endDate: to, dataState: "all" };
  const [byPage, byPageQuery, overall] = await Promise.all([
    searchAnalytics(site.data, { ...range, dimensions: ["page"], rowLimit: 5000 }),
    searchAnalytics(site.data, { ...range, dimensions: ["page", "query"], rowLimit: 25000 }),
    searchAnalytics(site.data, { ...range, rowLimit: 1 }),
  ]);
  if (!byPage.ok) return empty(byPage.reason, site.data);

  const wanted = new Set(paths);
  const pageRows = new Map<string, Row[]>();
  for (const row of byPage.data) {
    const path = pathOf(row.keys[0] ?? "");
    if (wanted.has(path)) pageRows.set(path, [...(pageRows.get(path) ?? []), row]);
  }
  const queryRows = new Map<string, Map<string, Row[]>>();
  if (byPageQuery.ok) {
    for (const row of byPageQuery.data) {
      const path = pathOf(row.keys[0] ?? "");
      if (!wanted.has(path)) continue;
      const query = (row.keys[1] ?? "").trim().toLowerCase();
      const forPage = queryRows.get(path) ?? new Map<string, Row[]>();
      forPage.set(query, [...(forPage.get(query) ?? []), row]);
      queryRows.set(path, forPage);
    }
  }

  const indexes = await Promise.all(paths.map((path) => indexStatus(site.data, path, fresh)));

  const pages = paths.map((path, i): SeoPage => {
    const total = fold(pageRows.get(path) ?? []);
    const queries = [...(queryRows.get(path) ?? new Map<string, Row[]>()).entries()]
      .map(([query, rows]) => {
        const folded = fold(rows);
        return { query, clicks: folded.clicks, impressions: folded.impressions, position: folded.position ?? 0 };
      })
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 50);
    return { path, ...total, queries, index: indexes[i] ?? null };
  });

  const whole = overall.ok ? overall.data[0] : undefined;
  const report: SeoReport = {
    connected: true,
    problem: byPageQuery.ok ? null : `Searches per page did not load: ${byPageQuery.reason}`,
    site: site.data,
    days,
    from,
    to,
    totals: whole ? { clicks: whole.clicks, impressions: whole.impressions, position: whole.position } : null,
    pages,
    generatedAt: new Date().toISOString(),
  };
  reportCache.set(cacheKey, { at: Date.now(), report });
  return report;
}
