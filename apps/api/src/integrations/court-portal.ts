import { randomUUID } from "node:crypto";
import { parse, type HTMLElement } from "node-html-parser";
import { logger } from "../logger.js";
import { HttpError } from "../lib/http.js";
import { date, partyName, splitCaseType, splitRegistration, text, type CourtRecord } from "./court-record.js";

/**
 * The court's own website — eCourts' district portal and High Court portal —
 * used the way a person uses it: they type the captcha the court shows, and
 * this module makes the same requests the court's page would.
 *
 *   services.ecourts.gov.in/ecourtindia_v6   district and subordinate courts
 *   hcservices.ecourts.gov.in/hcservices     High Courts
 *
 * The captcha is always typed by a person — this never reads it by software —
 * and a lookup happens only when someone asks for one. Free, and the only
 * source of interim-order PDFs that costs nothing.
 *
 * The request details come from the portals' own public JavaScript
 * (components.js, searchByCNR.js, main.php). When eCourts changes them, this
 * file is what needs updating; failures are logged with the step that broke.
 */

const DISTRICT = "https://services.ecourts.gov.in/ecourtindia_v6";
const HIGH_COURT = "https://hcservices.ecourts.gov.in/hcservices";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const TIMEOUT_MS = 30_000;
const SESSION_TTL_MS = 5 * 60 * 1000;

export type Portal = "district" | "hc";

/** A CNR's first four letters name the establishment; "HC" in them is a High Court. */
export function portalFor(cnr: string): Portal {
  return cnr.slice(2, 4) === "HC" ? "hc" : "district";
}

// ---------------------------------------------------------------------------
// Sessions (in memory — a captcha is only good for a minute or two anyway)
// ---------------------------------------------------------------------------

class CookieJar {
  private cookies = new Map<string, string>();
  absorb(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0] ?? "";
      const at = pair.indexOf("=");
      if (at > 0) this.cookies.set(pair.slice(0, at).trim(), pair.slice(at + 1).trim());
    }
  }
  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

type Session = {
  id: string;
  portal: Portal;
  cnr: string;
  caseId: string;
  owner: string;
  jar: CookieJar;
  appToken: string;
  ajaxHeaders: Record<string, string>;
  createdAt: number;
  attempts: number;
};

const sessions = new Map<string, Session>();

function sweep() {
  const now = Date.now();
  for (const [id, session] of sessions) if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
}

function sessionFor(id: string, owner: string, caseId: string): Session {
  sweep();
  const session = sessions.get(id);
  if (!session || session.owner !== owner || session.caseId !== caseId) {
    throw new HttpError(410, "That captcha has expired. Please start again.", "portal_expired");
  }
  return session;
}

async function request(
  session: Session,
  url: string,
  options: { form?: Record<string, string>; ajax?: boolean } = {},
): Promise<Response> {
  const base = session.portal === "hc" ? HIGH_COURT : DISTRICT;
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Referer: `${base}/`,
    Accept: options.ajax ? "application/json, text/javascript, */*; q=0.01" : "*/*",
  };
  const cookie = session.jar.header();
  if (cookie) headers.Cookie = cookie;
  if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
    headers["X-Requested-With"] = "XMLHttpRequest";
  }
  if (options.ajax) Object.assign(headers, session.ajaxHeaders);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.form ? "POST" : "GET",
      headers,
      body: options.form ? new URLSearchParams(options.form).toString() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    logger.warn({ err: error, url: url.replace(/\?.*/, "") }, "Court portal unreachable");
    throw new HttpError(504, "The court's website is not responding. Please try again in a while.", "portal_unreachable");
  }
  session.jar.absorb(response);
  return response;
}

// ---------------------------------------------------------------------------
// District portal's AJAX conventions
// ---------------------------------------------------------------------------

/** The rotating secret and the header names that carry it, from components.js. */
function readAjaxHeaders(js: string): Record<string, string> {
  const secret = js.match(/var\s+delimeter\s*=\s*["']([^"']+)["']/)?.[1] ?? "";
  const start = js.indexOf("function ajaxCall");
  const block = start >= 0 ? js.slice(start).match(/headers\s*:\s*\{([^}]*)\}/)?.[1] ?? "" : "";
  const names = [...block.matchAll(/["']?([\w-]+)["']?\s*:\s*delimeter\b/g)].map((m) => m[1]!);
  if (!secret || names.length === 0) {
    logger.warn({ haveSecret: Boolean(secret), names: names.length }, "Court portal: request-header scheme not found in components.js");
  }
  return Object.fromEntries((names.length ? names : ["delimeter"]).map((name) => [name, secret]));
}

async function districtAjax(session: Session, action: string, form: Record<string, string>) {
  const response = await request(session, `${DISTRICT}/?p=${action}`, {
    form: { ...form, ajax_req: "true", app_token: session.appToken },
    ajax: true,
  });
  const raw = await response.text();
  let body: Record<string, unknown> | null = null;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Errors come back as text with the token after "#####".
    const token = raw.split("#####")[1];
    if (token) session.appToken = token.trim();
  }
  if (body && typeof body.app_token === "string" && body.app_token) session.appToken = body.app_token;
  return { body, raw };
}

async function captchaImage(session: Session): Promise<string> {
  const url =
    session.portal === "hc"
      ? `${HIGH_COURT}/securimage/securimage_show.php?${Math.random()}`
      : `${DISTRICT}/vendor/securimage/securimage_show.php?${Math.random()}`;
  const response = await request(session, url);
  const type = response.headers.get("content-type") ?? "image/png";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!type.startsWith("image/") || bytes.length < 100) {
    logger.warn({ portal: session.portal, type, bytes: bytes.length }, "Court portal: captcha image missing");
    throw new HttpError(502, "The court's website did not send its captcha. Please try again.", "portal_no_captcha");
  }
  return `data:${type.split(";")[0]};base64,${bytes.toString("base64")}`;
}

// ---------------------------------------------------------------------------
// Public steps
// ---------------------------------------------------------------------------

/** Opens a court-website session for a CNR and returns its captcha image. */
export async function startPortalLookup(cnr: string, caseId: string, owner: string) {
  sweep();
  const portal = portalFor(cnr);
  const session: Session = {
    id: randomUUID(),
    portal,
    cnr,
    caseId,
    owner,
    jar: new CookieJar(),
    appToken: "",
    ajaxHeaders: {},
    createdAt: Date.now(),
    attempts: 0,
  };

  if (portal === "district") {
    const home = await request(session, `${DISTRICT}/`);
    const html = await home.text();
    session.appToken = html.match(/id=['"]app_token['"][^>]*value=['"]([^'"]*)['"]/)?.[1] ?? html.match(/value=['"]([^'"]*)['"][^>]*id=['"]app_token['"]/)?.[1] ?? "";
    const js = await (await request(session, `${DISTRICT}/js/components.js`)).text();
    session.ajaxHeaders = readAjaxHeaders(js);
    await districtAjax(session, "casestatus/getCaptcha", {}).catch(() => undefined);
  } else {
    await request(session, `${HIGH_COURT}/main.php`);
  }

  const captcha = await captchaImage(session);
  sessions.set(session.id, session);
  return { sessionId: session.id, portal, captcha };
}

/** A fresh captcha image for the same session, when the first is unreadable. */
export async function newPortalCaptcha(sessionId: string, caseId: string, owner: string) {
  const session = sessionFor(sessionId, owner, caseId);
  return { sessionId, captcha: await captchaImage(session) };
}

export type PortalOrder = {
  orderDate: Date;
  title: string;
  final: boolean;
  /** Stable per-order key from the court's link (its file name). */
  fileKey: string;
  /** How to fetch the PDF: the district portal's displayPdf() arguments, or the High Court's link. */
  fetch: { kind: "district"; args: string[] } | { kind: "hc"; href: string };
};

export type PortalResult =
  | { ok: false; reason: "captcha"; captcha: string }
  | { ok: true; html: string; record: CourtRecord; orders: PortalOrder[]; session: Session };

/**
 * Submits the typed captcha and returns the case page, read into the same
 * record shape as eCourtsIndia's (so the same code stores it), plus the
 * orders found on it. A wrong captcha returns a new one to try.
 */
export async function submitPortalCaptcha(sessionId: string, caseId: string, owner: string, code: string): Promise<PortalResult> {
  const session = sessionFor(sessionId, owner, caseId);
  session.attempts += 1;
  if (session.attempts > 5) {
    sessions.delete(session.id);
    throw new HttpError(429, "Too many tries. Please start again.", "portal_attempts");
  }
  const typed = code.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);

  let html: string;
  if (session.portal === "district") {
    const { body, raw } = await districtAjax(session, "cnr_status/searchByCNR/", { cino: session.cnr, fcaptcha_code: typed });
    const status = body ? Number(body.status) : NaN;
    if (status === 0 || /invalid captcha/i.test(raw)) return { ok: false, reason: "captcha", captcha: await captchaImage(session) };
    html = typeof body?.casetype_list === "string" ? body.casetype_list : "";
  } else {
    const response = await request(session, `${HIGH_COURT}/cases_qry/index_qry.php`, {
      form: { captcha: typed, cino: session.cnr, appFlag: "web", action_code: "fetchStateDistCourtNew", caseStatusSearchType: "CNRNumber" },
    });
    html = (await response.text()).trim();
    if (/^invalid captcha$/i.test(html)) return { ok: false, reason: "captcha", captcha: await captchaImage(session) };
    if (html === "THERE IS AN ERROR") html = "";
  }

  if (!html || html.length < 200 || /does not exist|record not found|not found/i.test(html.slice(0, 400))) {
    sessions.delete(session.id);
    throw new HttpError(404, "The court's website has no case with this CNR.", "portal_not_found");
  }

  const record = readCasePage(html, session.portal);
  const orders = readOrders(html, session.portal);
  if (!record.hearings.length && !orders.length && !record.status) {
    logger.warn({ portal: session.portal, bytes: html.length }, "Court portal: case page had nothing we could read — layout may have changed");
  }
  return { ok: true, html, record, orders, session };
}

/** Downloads one order's PDF within the session. Returns null if the court sends something else. */
export async function downloadPortalOrder(session: Session, order: PortalOrder): Promise<Buffer | null> {
  let url: string;
  if (order.fetch.kind === "district") {
    const [normal_v = "", case_val = "", court_code = "", filename = "", appFlag = ""] = order.fetch.args;
    const { body } = await districtAjax(session, "home/display_pdf", { normal_v, case_val, court_code, filename, appFlag });
    const path = typeof body?.order === "string" ? body.order : "";
    if (!path) return null;
    url = path.startsWith("http") ? path : `${DISTRICT}/${path.replace(/^\/+/, "")}`;
  } else {
    url = order.fetch.href.startsWith("http") ? order.fetch.href : `${HIGH_COURT}/${order.fetch.href.replace(/^\/+/, "")}`;
  }

  let bytes = Buffer.from(await (await request(session, url)).arrayBuffer());
  // The High Court sometimes wraps the PDF in a page with an <object>/<iframe>.
  if (bytes.subarray(0, 4).toString() !== "%PDF") {
    const inner = bytes.toString("latin1").match(/(?:data|src)=['"]([^'"]+\.pdf[^'"]*)['"]/i)?.[1];
    if (inner) {
      const base = session.portal === "hc" ? `${HIGH_COURT}/cases/` : `${DISTRICT}/`;
      bytes = Buffer.from(await (await request(session, inner.startsWith("http") ? inner : base + inner)).arrayBuffer());
    }
  }
  return bytes.subarray(0, 4).toString() === "%PDF" ? bytes : null;
}

export function endPortalSession(sessionId: string) {
  sessions.delete(sessionId);
}

// ---------------------------------------------------------------------------
// Reading the case page
// ---------------------------------------------------------------------------

const clean = (value: string) => value.replace(/ /g, " ").replace(/\s+/g, " ").trim();

/** Label → value from the page's two-column tables ("Case Type | CC - Ct Cases | Filing Number | …"). */
function labelValues(root: HTMLElement): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of root.querySelectorAll("tr")) {
    const cells = row.querySelectorAll("th, td").map((cell) => clean(cell.text));
    for (let i = 0; i + 1 < cells.length; i += 2) {
      const label = cells[i]!.replace(/[:\s]+$/, "").toLowerCase();
      if (label && label.length < 40 && cells[i + 1] && !map.has(label)) map.set(label, cells[i + 1]!);
    }
  }
  // Some portals use <label>…</label><span>…</span> pairs.
  for (const label of root.querySelectorAll("label")) {
    const key = clean(label.text).replace(/[:\s]+$/, "").toLowerCase();
    const value = clean(label.nextElementSibling?.text ?? "");
    if (key && value && key.length < 40 && !map.has(key)) map.set(key, value);
  }
  return map;
}

function first(map: Map<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    for (const [label, value] of map) if (label.startsWith(key)) return value;
  }
  return null;
}

function parties(root: HTMLElement, kind: "Petitioner" | "Respondent") {
  const block = root.querySelector(`[class*="${kind}_Advocate"]`) ?? root.querySelector(`[class*="${kind.toLowerCase()}"]`);
  if (!block) return [];
  return block.text
    .split(/\n|(?=\b\d+\)\s)/)
    .map((line) => clean(line))
    .filter(Boolean)
    .map((line) => {
      const [name, counsel] = line.split(/\s*Advocate\s*[-:–]\s*/i);
      const person = partyName(name);
      return person ? { name: person, counsel: partyName(counsel ?? "") } : null;
    })
    .filter((p): p is { name: string; counsel: string | null } => Boolean(p))
    .slice(0, 30);
}

function readCasePage(html: string, portal: Portal): CourtRecord {
  const root = parse(html);
  const fields = labelValues(root);

  const type = splitCaseType(text(first(fields, "case type"), 120));
  const registration = splitRegistration(text(first(fields, "registration number", "registration no"), 80));
  const status = text(first(fields, "case status"), 120);
  const decisionDate = date(first(fields, "decision date", "date of decision"));
  const disposed = Boolean(decisionDate) || /dispos|decided/i.test(status ?? "");

  // Hearing history: the table whose header has "Business on Date" and "Hearing Date".
  const hearings: CourtRecord["hearings"] = [];
  for (const table of root.querySelectorAll("table")) {
    const header = table.querySelector("tr");
    const heads = header ? header.querySelectorAll("th, td").map((cell) => clean(cell.text).toLowerCase()) : [];
    const businessAt = heads.findIndex((h) => h.includes("business on date"));
    const hearingAt = heads.findIndex((h) => h.includes("hearing date"));
    if (businessAt < 0 || hearingAt < 0) continue;
    const judgeAt = heads.findIndex((h) => h.includes("judge"));
    const purposeAt = heads.findIndex((h) => h.includes("purpose"));
    for (const row of table.querySelectorAll("tr").slice(1)) {
      const cells = row.querySelectorAll("td").map((cell) => clean(cell.text));
      const onDate = date(cells[businessAt]);
      if (!onDate) continue;
      hearings.push({
        hearingDate: onDate,
        purpose: text(cells[purposeAt] ?? null, 200),
        judge: judgeAt >= 0 ? text(cells[judgeAt] ?? null, 300) : null,
        business: null,
        nextDate: date(cells[hearingAt]),
      });
    }
  }
  const unique = new Map(hearings.map((h) => [h.hearingDate.getTime(), h]));

  const acts: string[] = [];
  for (const table of root.querySelectorAll("table")) {
    const head = clean(table.querySelector("tr")?.text ?? "").toLowerCase();
    if (!head.includes("under act")) continue;
    for (const row of table.querySelectorAll("tr").slice(1)) {
      const [act, section] = row.querySelectorAll("td").map((cell) => clean(cell.text));
      if (act) acts.push(section ? `Section ${section}, ${act}` : act);
    }
  }

  const nextHearingDate = disposed ? null : date(first(fields, "next hearing date", "next date"));
  return {
    courtLevel: portal === "hc" ? "HIGH_COURT" : "DISTRICT_COURT",
    courtName: null,
    state: null,
    district: null,
    courtHall: null,
    coram: text(first(fields, "court number and judge", "coram", "judge"), 300),
    caseTypeCode: type.code ?? registration.code,
    caseTypeName: type.name,
    caseNumber: registration.number,
    caseYear: registration.year,
    filingNumber: text(first(fields, "filing number", "filing no"), 60),
    filingDate: date(first(fields, "filing date")),
    registrationDate: date(first(fields, "registration date")),
    status,
    stage: disposed ? null : text(first(fields, "case stage", "stage of case", "stage"), 200),
    disposed,
    lastHearingDate: [...unique.values()].sort((a, b) => +b.hearingDate - +a.hearingDate)[0]?.hearingDate ?? null,
    nextHearingDate,
    nextHearingPurpose: nextHearingDate ? text(first(fields, "purpose of hearing", "stage of case"), 200) : null,
    disposalDate: decisionDate,
    disposalNature: text(first(fields, "nature of disposal"), 200),
    petitioners: parties(root, "Petitioner"),
    respondents: parties(root, "Respondent"),
    actsAndSections: [...new Set(acts)].slice(0, 30),
    hearings: [...unique.values()].sort((a, b) => +a.hearingDate - +b.hearingDate),
    orders: [],
    facts: [],
  };
}

/** Every order on the page with a way to fetch its PDF. */
function readOrders(html: string, portal: Portal): PortalOrder[] {
  const root = parse(html);
  const orders: PortalOrder[] = [];
  const seen = new Set<string>();

  const links =
    portal === "district"
      ? root.querySelectorAll("[onclick*='displayPdf'], a[href*='displayPdf']")
      : root.querySelectorAll("a[href*='display_pdf.php']");

  for (const link of links) {
    let fetch: PortalOrder["fetch"] | null = null;
    let fileKey = "";
    if (portal === "district") {
      const call = (link.getAttribute("onclick") ?? link.getAttribute("href") ?? "").match(/displayPdf\(([^)]*)\)/)?.[1] ?? "";
      const args = [...call.matchAll(/'([^']*)'|"([^"]*)"/g)].map((m) => m[1] ?? m[2] ?? "");
      if (args.length < 4) continue;
      fetch = { kind: "district", args };
      fileKey = args[3]!;
    } else {
      const href = (link.getAttribute("href") ?? "").replace(/&amp;/g, "&");
      fetch = { kind: "hc", href };
      fileKey = new URLSearchParams(href.split("?")[1] ?? "").get("filename") ?? href;
    }
    if (!fileKey || seen.has(fileKey)) continue;
    seen.add(fileKey);

    const row = link.closest("tr");
    const rowText = clean(row?.text ?? link.text);
    const orderDate = date(rowText.match(/\b\d{2}-\d{2}-\d{4}\b/)?.[0]) ?? date(rowText.match(/\b\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}\b/)?.[0]);
    if (!orderDate) continue;

    // Final orders and judgments sit under their own heading on the page.
    const at = html.indexOf(fileKey);
    const before = html.slice(Math.max(0, at - 6000), at).toLowerCase();
    const final = before.lastIndexOf("final order") > before.lastIndexOf("interim order") || /judg(e)?ment/i.test(clean(link.text));

    orders.push({
      orderDate,
      title: text(clean(link.text), 120) ?? (final ? "Final order" : "Order"),
      final,
      fileKey: fileKey.slice(0, 300),
      fetch,
    });
  }
  return orders;
}
