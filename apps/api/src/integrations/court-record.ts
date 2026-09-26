import { createHash } from "node:crypto";
import { prisma } from "../db.js";
import { fetchCaseByCnr } from "./ecourts.js";
import type { Principal } from "../auth/session.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * What the firm keeps from an eCourtsIndia case record, and how it lands.
 *
 * Three layers, from rawest to most useful:
 *
 *   CourtSnapshot   the response exactly as received — a new row only when
 *                   the record has changed, so it is a history of what the
 *                   court's record said and when, not a log of every look;
 *   CourtHearing,   the hearing history and the orders, one row each,
 *   CourtOrder      upserted so re-reading the same record never duplicates;
 *   Case            the handful of fields the dashboards show at a glance —
 *                   next date, stage, coram, disposal — kept current.
 *
 * The court is authoritative for what the court decides (dates, stage,
 * bench, disposal) and those are overwritten on every sync. Identity fields
 * the firm may have written more carefully (court name, case number, dates
 * of filing and registration) are only filled when empty. The firm's own
 * judgement — title, summary, practice area, parties, its status and stage
 * — is never touched by a sync, except that a court disposal moves an open
 * case to Disposed.
 *
 * eCourtsIndia's schema is not published field by field, so every value is
 * read from a short list of candidate keys (the ones their guides name, and
 * the labels on the eCourts status pages they scrape). A field that cannot
 * be found is left alone rather than guessed; the raw snapshot is kept
 * either way, so nothing is lost if a key is missed here.
 */

type Obj = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Reading an unknown payload
// ---------------------------------------------------------------------------

function asObj(value: unknown): Obj | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : null;
}

function isEmpty(value: unknown) {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

/** The first non-empty value among `keys`, looked up in each object in turn. */
function pick(sources: (Obj | null)[], keys: string[]): unknown {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      if (!isEmpty(source[key])) return source[key];
    }
  }
  return undefined;
}

function text(value: unknown, max = 300): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    const cleaned = value.replace(/\s+/g, " ").trim();
    return cleaned ? cleaned.slice(0, max) : null;
  }
  const o = asObj(value);
  if (o) return text(o.name ?? o.value ?? o.label, max);
  return null;
}

function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) return value.split(/\n|;/);
  return [];
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Court dates come as ISO, `DD-MM-YYYY`, `DD/MM/YYYY` or `20th September
 * 2024`. Returned as UTC midnight, matching the `@db.Date` columns.
 */
function date(value: unknown): Date | null {
  const raw = text(value, 60);
  if (!raw) return null;
  const utc = (y: number, m: number, d: number) => {
    const result = new Date(Date.UTC(y, m - 1, d));
    return result.getUTCMonth() === m - 1 && y > 1900 && y < 2200 ? result : null;
  };

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return utc(+match[1]!, +match[2]!, +match[3]!);

  match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) return utc(+match[3]!, +match[2]!, +match[1]!);

  match = raw.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3})[A-Za-z]*,?[\s-]+(\d{4})$/);
  if (match && MONTHS[match[2]!.toLowerCase()]) {
    return utc(+match[3]!, MONTHS[match[2]!.toLowerCase()]!, +match[1]!);
  }
  return null;
}

/** "1) Ravi Kumar" / "2. State of Telangana" → the name alone. */
function partyName(value: unknown): string | null {
  const name = text(value);
  return name ? name.replace(/^\(?\d+\s*[).:-]\s*/, "").trim() || null : null;
}

/**
 * eCourts' "business" cells keep the page's line breaks and label/value
 * layout ("--\nReason for Adjournment\n:\nJudge on Leave"). Flattened to one
 * readable line; a bare "--" means nothing was recorded.
 */
function business(value: unknown): string | null {
  if (typeof value !== "string") return text(value, 2000);
  const cleaned = value
    .replace(/\s*\n\s*:\s*\n\s*/g, ": ")
    .replace(/\s*\n\s*/g, " · ")
    .replace(/[ \t]+/g, " ")
    .replace(/^-+\s*(·\s*)?/, "")
    .trim();
  return cleaned ? cleaned.slice(0, 2000) : null;
}

/** Records give the state as a code ("DL"); the dashboards want its name. */
const STATE_NAMES: Record<string, string> = {
  AP: "Andhra Pradesh", AR: "Arunachal Pradesh", AS: "Assam", BR: "Bihar", CG: "Chhattisgarh", CH: "Chandigarh",
  DL: "Delhi", GA: "Goa", GJ: "Gujarat", HP: "Himachal Pradesh", HR: "Haryana", JH: "Jharkhand",
  JK: "Jammu and Kashmir", KA: "Karnataka", KL: "Kerala", LA: "Ladakh", MH: "Maharashtra", ML: "Meghalaya",
  MN: "Manipur", MP: "Madhya Pradesh", MZ: "Mizoram", NL: "Nagaland", OD: "Odisha", OR: "Odisha", PB: "Punjab",
  PY: "Puducherry", RJ: "Rajasthan", SK: "Sikkim", TG: "Telangana", TS: "Telangana", TN: "Tamil Nadu",
  TR: "Tripura", UK: "Uttarakhand", UP: "Uttar Pradesh", WB: "West Bengal",
};

function stateName(value: string | null): string | null {
  if (!value) return null;
  return /^[A-Z]{2,3}$/.test(value) ? STATE_NAMES[value] ?? value : value;
}

/** "DISMISSED_AS_WITHDRAWN" → "Dismissed as withdrawn". */
function humanise(value: string | null): string | null {
  if (!value) return null;
  if (value !== value.toUpperCase()) return value;
  const words = value.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ---------------------------------------------------------------------------
// The normalised record
// ---------------------------------------------------------------------------

export type CourtRecord = {
  courtLevel: "SUPREME_COURT" | "HIGH_COURT" | "DISTRICT_COURT" | "TRIBUNAL";
  courtName: string | null;
  state: string | null;
  district: string | null;
  courtHall: string | null;
  coram: string | null;
  caseTypeCode: string | null;
  caseTypeName: string | null;
  caseNumber: string | null;
  caseYear: number | null;
  filingNumber: string | null;
  filingDate: Date | null;
  registrationDate: Date | null;
  status: string | null;
  stage: string | null;
  disposed: boolean;
  lastHearingDate: Date | null;
  nextHearingDate: Date | null;
  nextHearingPurpose: string | null;
  disposalDate: Date | null;
  disposalNature: string | null;
  petitioners: { name: string; counsel: string | null }[];
  respondents: { name: string; counsel: string | null }[];
  actsAndSections: string[];
  hearings: { hearingDate: Date; purpose: string | null; judge: string | null; business: string | null; nextDate: Date | null }[];
  orders: { orderDate: Date; orderType: string; fileName: string; summary: string | null }[];
  /** Everything else worth showing that has no column of its own. */
  facts: { label: string; value: string }[];
};

/**
 * High Court CNR prefixes, where known. A CNR starts with the court's
 * establishment code, not the state code: the Telangana High Court's is
 * HBHC01 (from its Hyderabad days), not "TS". Only prefixes confirmed from
 * published CNRs are listed; anything else is still read as a High Court
 * when it carries "HC" in the code, and the court's own name from the
 * eCourts record is used first in any case.
 */
const HIGH_COURT_BY_PREFIX: Record<string, { name: string; state: string }> = {
  HBHC: { name: "High Court for the State of Telangana", state: "Telangana" },
  APHC: { name: "High Court of Andhra Pradesh", state: "Andhra Pradesh" },
  KAHC: { name: "High Court of Karnataka", state: "Karnataka" },
  DLHC: { name: "High Court of Delhi", state: "Delhi" },
};

function splitCaseType(raw: string | null): { code: string | null; name: string | null } {
  if (!raw) return { code: null, name: null };
  // "WP - WRIT PETITION", "W.P.(C) - Writ Petition (Civil)"
  const parts = raw.split(/\s+-\s+/);
  if (parts.length >= 2) return { code: parts[0]!.trim(), name: parts.slice(1).join(" - ").trim() };
  // A short token is an abbreviation ("CRL.P"); anything longer is a name.
  return raw.length <= 16 && raw.split(/\s+/).length <= 2 ? { code: raw, name: null } : { code: null, name: raw };
}

/** "WP/12345/2024", "12345/2024", "W.P. No. 1234 of 2024". */
function splitRegistration(raw: string | null) {
  if (!raw) return { code: null, number: null, year: null };
  const match = raw.match(/^(.*?)[\s/]*(?:No\.?\s*)?(\d+)\s*(?:\/|of)\s*(\d{4})$/i);
  if (!match) return { code: null, number: raw.slice(0, 40), year: null };
  const code = match[1]!.replace(/[\s/]+$/, "").trim();
  return { code: code || null, number: match[2]!, year: Number(match[3]) };
}

function people(names: unknown, counsel: unknown) {
  const counselList = list(counsel).map(partyName);
  return list(names)
    .map((entry, index) => {
      const o = asObj(entry);
      const name = partyName(o ? (o.name ?? o.partyName) : entry);
      if (!name) return null;
      const own = o ? partyName(o.advocate ?? o.advocateName ?? o.counsel) : null;
      return { name, counsel: own ?? counselList[index] ?? (counselList.length === 1 ? counselList[0]! : null) };
    })
    .filter((p): p is { name: string; counsel: string | null } => Boolean(p));
}

export function readCourtRecord(cnr: string, data: unknown): CourtRecord {
  const root = asObj(data) ?? {};
  const tribunal = asObj(root.tribunalCaseData);
  const main = asObj(root.courtCaseData) ?? tribunal ?? asObj(root.caseData) ?? asObj(root.case) ?? root;
  const entity = asObj(root.entityInfo);
  const src = [main, root, entity];
  const get = (...keys: string[]) => pick(src, keys);
  // eCourtsIndia sends codes with their meanings alongside:
  // descriptions.enumLookup.caseType.CC = "Criminal Complaint Case".
  const lookup = asObj(asObj(root.descriptions)?.enumLookup);
  const meaning = (field: string, code: string | null) =>
    code ? text(asObj(lookup?.[field])?.[code], 200) : null;

  const prefix = cnr.slice(0, 4);
  const isHighCourt = prefix.slice(2) === "HC" || prefix.startsWith("HC");
  const courtLevel: CourtRecord["courtLevel"] = cnr.startsWith("SCIN")
    ? "SUPREME_COURT"
    : tribunal
      ? "TRIBUNAL"
      : isHighCourt
        ? "HIGH_COURT"
        : "DISTRICT_COURT";
  const knownHc = isHighCourt ? HIGH_COURT_BY_PREFIX[prefix] : undefined;

  const rawType = splitCaseType(text(get("caseTypeName", "caseType", "caseTypeDescription", "type"), 120));
  const type = {
    code: rawType.code,
    name: rawType.name ?? meaning("caseType", rawType.code) ?? text(get("caseTypeRaw"), 120),
  };
  const registration = splitRegistration(text(get("registrationNumber", "regNo", "caseNumber", "caseNo"), 80));

  const statusCode = text(get("caseStatus", "status"), 120);
  const status = meaning("caseStatus", statusCode) ?? humanise(statusCode);
  const disposalDate = date(get("decisionDate", "disposalDate", "dateOfDecision"));
  const disposed = Boolean(disposalDate) || /dispos|decided|closed/i.test(statusCode ?? "");
  // "purpose" is what the case is next listed for — its stage while pending.
  const stage = text(get("caseStage", "stageOfCase", "stage"), 200) ?? (disposed ? null : text(get("purpose"), 200));

  const judges = list(get("judges", "judge", "judgeName", "coram", "courtNumberAndJudge"))
    .map((j) => text(j))
    .filter(Boolean);

  const parties = asObj(get("parties"));
  const petitioners = people(
    get("petitioners", "petitioner", "petitionerNames") ?? parties?.petitioners,
    get("petitionerAdvocates", "petitionerAdvocate", "petitionerCounsel"),
  );
  const respondents = people(
    get("respondents", "respondent", "respondentNames") ?? parties?.respondents,
    get("respondentAdvocates", "respondentAdvocate", "respondentCounsel"),
  );

  const acts = list(get("actsAndSections", "acts", "actSections"))
    .map((entry) => {
      const o = asObj(entry);
      if (!o) return text(entry, 200);
      const act = text(o.act ?? o.actName ?? o.underAct, 160);
      const section = text(o.section ?? o.sections ?? o.underSection, 80);
      if (act && section) return `Section ${section.replace(/^s(ection)?\.?\s*/i, "")}, ${act}`;
      return act ?? section;
    })
    .filter((a): a is string => Boolean(a));

  // What was done on each date ("Business on Date"), listed separately from
  // the history table and usually the more informative of the two.
  const businessByDate = new Map<number, { business: string | null; judge: string | null; nextDate: Date | null }>();
  for (const entry of list(get("businessOnDateEntries"))) {
    const o = asObj(entry);
    const day = o ? date(o.date ?? o.businessOnDate) : null;
    if (!o || !day) continue;
    businessByDate.set(day.getTime(), {
      business: business(o.business),
      judge: text(o.courtOf ?? o.judge, 300),
      nextDate: date(o.nextHearingDate ?? o.nextDate),
    });
  }

  const listed = list(get("historyOfCaseHearings", "historyOfCaseHearing", "hearingHistory", "caseHistory", "hearings"))
    .map((entry) => {
      const o = asObj(entry);
      if (!o) return null;
      // On eCourts' history table, "Business on Date" is the day of the
      // hearing and "Hearing Date" is the date it was adjourned to.
      const onDate = date(o.businessOnDate ?? o.businessDate);
      const hearingDate = onDate ?? date(o.hearingDate ?? o.date ?? o.listingDate);
      if (!hearingDate) return null;
      return {
        hearingDate,
        purpose: text(o.purpose ?? o.purposeOfHearing ?? o.purposeOfListing ?? o.stage, 200),
        judge: text(o.judge ?? o.judgeName ?? o.coram, 300),
        business: business(o.business ?? o.remarks ?? o.proceedings) ?? businessByDate.get(hearingDate.getTime())?.business ?? null,
        nextDate: onDate ? date(o.hearingDate ?? o.nextDate) : date(o.nextHearingDate ?? o.nextDate),
      };
    })
    .filter((h): h is NonNullable<typeof h> => Boolean(h));

  // One row per date (the table is unique on it), adding any day that only
  // appears in the business entries.
  const byDate = new Map<number, CourtRecord["hearings"][number]>();
  for (const hearing of listed) if (!byDate.has(hearing.hearingDate.getTime())) byDate.set(hearing.hearingDate.getTime(), hearing);
  for (const [day, entry] of businessByDate) {
    if (byDate.has(day)) continue;
    byDate.set(day, { hearingDate: new Date(day), purpose: null, judge: entry.judge, business: entry.business, nextDate: entry.nextDate });
  }
  const hearings = [...byDate.values()].sort((a, b) => +a.hearingDate - +b.hearingDate);

  const orders = [
    ...list(get("judgmentOrders", "orders")),
    ...list(get("interimOrders")),
    ...list(get("finalOrders")),
  ]
    .map((entry) => {
      const o = asObj(entry);
      if (!o) return null;
      const orderDate = date(o.orderDate ?? o.date);
      if (!orderDate) return null;
      return {
        orderDate,
        orderType: humanise(text(o.orderType ?? o.type ?? o.orderDescription ?? o.description, 120)) ?? "Order",
        fileName: text(o.orderUrl ?? o.pdfFile ?? o.fileName ?? o.file, 300) ?? "",
        summary: text(o.summary ?? asObj(o.aiAnalysis)?.summary, 2000),
      };
    })
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  // The last hearing is the latest one on or before today, if the court
  // did not give it outright.
  const today = new Date(new Date().toISOString().slice(0, 10));
  const pastHearings = hearings.filter((h) => h.hearingDate <= today).sort((a, b) => +b.hearingDate - +a.hearingDate);
  const nextHearingDate = disposed ? null : date(get("nextHearingDate", "nextDate", "nextListingDate", "nextDateOfHearing"));
  const latestJudge = [...hearings].reverse().find((h) => h.judge)?.judge ?? null;

  return {
    courtLevel,
    courtName: text(get("courtName", "courtEstablishment", "establishmentName", "court"), 200) ?? knownHc?.name ?? null,
    state: stateName(text(get("stateName", "state"), 100)) ?? knownHc?.state ?? null,
    district: text(get("districtName", "district"), 100),
    courtHall: text(get("courtNumber", "courtNo", "courtHall", "courtRoom"), 60),
    coram: judges.length ? judges.join(", ").slice(0, 300) : disposed ? null : latestJudge,
    caseTypeCode: (type.code ?? registration.code)?.slice(0, 40) ?? null,
    caseTypeName: type.name,
    caseNumber: registration.number,
    caseYear: registration.year,
    filingNumber: text(get("filingNumber", "filingNo", "eFilingNumber"), 60),
    filingDate: date(get("filingDate", "dateOfFiling", "eFilingDate")),
    registrationDate: date(get("registrationDate", "dateOfRegistration")),
    status,
    stage,
    disposed,
    lastHearingDate: date(get("lastHearingDate", "lastDate", "lastListingDate")) ?? pastHearings[0]?.hearingDate ?? null,
    nextHearingDate,
    nextHearingPurpose: nextHearingDate ? text(get("nextHearingPurpose", "purposeOfHearing", "purposeOfListing", "purpose"), 200) : null,
    disposalDate,
    disposalNature: humanise(text(get("natureOfDisposal", "disposalNature", "disposalTypeRaw", "disposalType"), 200)),
    petitioners,
    respondents,
    actsAndSections: [...new Set(acts)].slice(0, 30),
    hearings,
    orders,
    facts: factsFrom(get, disposed),
  };
}

/**
 * The rest of the record, as label/value pairs for the case's court record
 * tab: FIR, category, related matters, the lower court. Read from the latest
 * stored snapshot each time the case is opened, so nothing here needs a
 * column, and a key read wrongly is fixed for every case by fixing it here.
 */
function factsFrom(get: (...keys: string[]) => unknown, disposed: boolean) {
  const facts: { label: string; value: string }[] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value) facts.push({ label, value });
  };
  const day = (value: unknown) => {
    const d = date(value);
    return d ? shortDate(d) : null;
  };
  const caseNumbers = (value: unknown) =>
    list(value)
      .map((entry) => {
        const o = asObj(entry);
        return o ? text(o.caseNumber ?? o.caseNo ?? o.cnr ?? o.number, 80) : text(entry, 80);
      })
      .filter(Boolean)
      .join(", ") || null;

  add("Category", text(get("caseCategoryFacetPath", "caseCategory", "category"), 200)?.replace(/\//g, " › "));
  add("Sub-type", text(get("caseTypeSub"), 200));
  add("First hearing", day(get("firstHearingDate")));

  const fir = asObj(get("firDetails", "fir"));
  if (fir) {
    const number = text(fir.caseNumber ?? fir.firNumber ?? fir.number, 40);
    const year = text(fir.year, 10);
    const station = text(fir.policeStation ?? fir.station, 160);
    add("FIR", [number && year ? `${number}/${year}` : number, station].filter(Boolean).join(", ") || null);
  }

  const lower = asObj(get("subordinateCourt", "lowerCourt"));
  if (lower) {
    add(
      "Lower court",
      [text(lower.courtName ?? lower.court, 200), text(lower.caseNumber ?? lower.caseNo, 80), day(lower.decisionDate ?? lower.orderDate)]
        .filter(Boolean)
        .join(" · ") || null,
    );
  }
  for (const earlier of list(get("earlierCourtDetails")).slice(0, 5)) {
    const o = asObj(earlier);
    if (o) add("Earlier court", [text(o.courtName ?? o.court, 200), text(o.caseNumber ?? o.caseNo, 80)].filter(Boolean).join(" · ") || null);
  }

  add("Tagged matters", caseNumbers(get("taggedMatters")));
  add("Linked cases", caseNumbers(get("linkCases", "linkedCases")));
  const ias = list(get("interlocutoryApplications"));
  if (ias.length) add("Interlocutory applications", String(ias.length));
  add("Contested", humanise(text(get("contestedStatus"), 40)));
  const days = Number(get("caseDurationDays"));
  if (disposed && Number.isFinite(days) && days > 0) add("Time to disposal", `${days.toLocaleString("en-IN")} days`);
  return facts;
}

// ---------------------------------------------------------------------------
// A new-case draft, for "fill from CNR"
// ---------------------------------------------------------------------------

const STAGE_WORDS: [RegExp, string][] = [
  [/dispos|decided/i, "DISPOSED"],
  [/reserved|judg(e)?ment|orders?$/i, "RESERVED_FOR_ORDERS"],
  [/argument/i, "ARGUMENTS"],
  [/evidence|examination|witness/i, "EVIDENCE"],
  [/written statement|counter|reply|rejoinder|pleading|appearance/i, "PLEADINGS"],
  [/notice/i, "NOTICE_ISSUED"],
  [/admission|fresh/i, "ADMISSION"],
  [/defect/i, "DEFECTS_NOTIFIED"],
  [/scrutiny/i, "UNDER_SCRUTINY"],
];

function stageFor(record: CourtRecord): string {
  if (record.disposed) return "DISPOSED";
  const words = `${record.stage ?? ""} ${record.nextHearingPurpose ?? ""}`;
  for (const [pattern, stage] of STAGE_WORDS) if (pattern.test(words)) return stage;
  return record.registrationDate || record.caseNumber ? "REGISTERED" : "FILED";
}

const ymd = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");

/** Cause title as Indian courts write it: "A & Ors. v. B & Anr.". */
function causeTitle(record: CourtRecord): string | null {
  const side = (list: { name: string }[]) =>
    list.length === 0 ? null : list.length === 1 ? list[0]!.name : `${list[0]!.name} & ${list.length === 2 ? "Anr." : "Ors."}`;
  const a = side(record.petitioners);
  const b = side(record.respondents);
  return a && b ? `${a} v. ${b}`.slice(0, 300) : a ?? b;
}

/**
 * The case form's shape, filled from the court record — strings, as the
 * form holds them. The person reviews and edits it before anything is saved.
 */
export function draftFromRecord(cnr: string, record: CourtRecord) {
  const number = [record.caseTypeCode, record.caseNumber, record.caseYear].filter(Boolean).join("/");
  return {
    title: causeTitle(record) ?? (number || `CNR ${cnr}`),
    status: record.disposed ? "DISPOSED" : "ACTIVE",
    stage: stageFor(record),
    courtLevel: record.courtLevel,
    courtName: record.courtLevel === "SUPREME_COURT" ? "Supreme Court of India" : record.courtName ?? "",
    bench: "",
    state: record.state ?? "",
    district: record.district ?? "",
    courtHall: record.courtHall ?? "",
    coram: record.coram ?? "",
    caseTypeCode: record.caseTypeCode ?? "",
    caseTypeName: record.caseTypeName ?? "",
    caseNumber: record.caseNumber ?? "",
    caseYear: record.caseYear ? String(record.caseYear) : "",
    filingNumber: record.filingNumber ?? "",
    filingDate: ymd(record.filingDate),
    registrationDate: ymd(record.registrationDate),
    cnrNumber: cnr,
    actsAndSections: record.actsAndSections,
    lastHearingDate: ymd(record.lastHearingDate),
    nextHearingDate: ymd(record.nextHearingDate),
    nextHearingPurpose: record.nextHearingPurpose ?? "",
    disposalDate: ymd(record.disposalDate),
    disposalNature: record.disposalNature ?? "",
    parties: [
      ...record.petitioners.map((p, i) => ({ role: "PETITIONER", position: i + 1, name: p.name, isClient: false, counsel: p.counsel })),
      ...record.respondents.map((p, i) => ({ role: "RESPONDENT", position: i + 1, name: p.name, isClient: false, counsel: p.counsel })),
    ].slice(0, 60),
    court: {
      status: record.status,
      stage: record.stage,
      hearings: record.hearings.length,
      orders: record.orders.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Storing
// ---------------------------------------------------------------------------

/** Keys that change on every scrape without the record changing. */
const VOLATILE = new Set(["dateModified", "lastUpdated", "updatedAt", "fetchedAt", "scrapedAt", "lastSyncedAt", "requestId"]);

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  const o = asObj(value);
  if (!o) return value;
  return Object.fromEntries(
    Object.keys(o)
      .filter((key) => !VOLATILE.has(key))
      .sort()
      .map((key) => [key, canonical(o[key])]),
  );
}

export function contentHash(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(data))).digest("hex");
}

/**
 * Keeps the response, unless the last stored one for this CNR (and case)
 * says the same thing. Returns the snapshot id either way.
 */
async function storeSnapshot(
  principal: Principal,
  cnr: string,
  caseId: string | null,
  data: unknown,
  requestId: string | null,
) {
  const hash = contentHash(data);
  const latest = await prisma.courtSnapshot.findFirst({
    where: { cnr, caseId },
    orderBy: { fetchedAt: "desc" },
    select: { id: true, contentHash: true },
  });
  if (latest?.contentHash === hash) return { id: latest.id, changed: false };

  const created = await prisma.courtSnapshot.create({
    data: {
      cnr,
      caseId,
      requestId,
      contentHash: hash,
      payload: data as Prisma.InputJsonValue,
      fetchedByUserId: principal.kind === "staff" ? principal.id : null,
      fetchedByClientId: principal.kind === "client" ? principal.id : null,
    },
    select: { id: true },
  });
  return { id: created.id, changed: true };
}

/**
 * A lookup before the case exists: fetch, keep the response unattached, and
 * return the record for the form. Saving a case with this CNR later picks
 * the snapshot up (see `attachCourtRecord`).
 */
export async function lookupCnr(principal: Principal, cnr: string) {
  const result = await fetchCaseByCnr(cnr);
  const snapshot = await storeSnapshot(principal, cnr, null, result.data, result.requestId);
  const record = readCourtRecord(cnr, result.data);
  return { cnr, requestId: result.requestId, snapshotId: snapshot.id, data: result.data, record };
}

const shortDate = (value: Date) =>
  value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null);

/**
 * Writes a court record onto a case: court-owned fields, hearing history,
 * orders, and a client-visible timeline entry for each change a client
 * would want to know about. Returns what changed, for the caller to show.
 */
export async function applyCourtRecord(
  caseId: string,
  record: CourtRecord,
  author: { userId?: string | null; clientId?: string | null },
  options: { rebuild?: boolean } = {},
) {
  const current = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: { orders: { select: { orderDate: true, orderType: true, fileName: true } } },
  });

  const fillIfEmpty = <T>(existing: T | null, incoming: T | null) =>
    existing === null || existing === "" ? incoming ?? undefined : undefined;

  const data: Prisma.CaseUpdateInput = {
    // Identity: the firm's entry wins when it has one.
    courtName: fillIfEmpty(current.courtName, record.courtName),
    state: fillIfEmpty(current.state, record.state),
    district: fillIfEmpty(current.district, record.district),
    caseTypeCode: fillIfEmpty(current.caseTypeCode, record.caseTypeCode),
    caseTypeName: fillIfEmpty(current.caseTypeName, record.caseTypeName),
    caseNumber: fillIfEmpty(current.caseNumber, record.caseNumber),
    caseYear: fillIfEmpty(current.caseYear, record.caseYear),
    filingNumber: fillIfEmpty(current.filingNumber, record.filingNumber),
    filingDate: fillIfEmpty(current.filingDate, record.filingDate),
    registrationDate: fillIfEmpty(current.registrationDate, record.registrationDate),
    actsAndSections: current.actsAndSections.length === 0 && record.actsAndSections.length ? record.actsAndSections : undefined,
    courtLevel: current.courtLevel === "NOT_IN_LITIGATION" ? record.courtLevel : undefined,

    // What the court decides: the court's record wins.
    courtStatus: record.status,
    courtStage: record.stage,
    courtCheckedAt: new Date(),
    coram: record.coram ?? undefined,
    courtHall: record.courtHall ?? undefined,
    lastHearingDate: record.lastHearingDate ?? undefined,
    nextHearingDate: record.disposed ? null : record.nextHearingDate ?? undefined,
    nextHearingPurpose: record.disposed ? null : record.nextHearingPurpose ?? undefined,
    disposalDate: record.disposalDate ?? undefined,
    disposalNature: record.disposalNature ?? undefined,
  };

  const changes: string[] = [];
  const timeline: Prisma.CaseUpdateCreateManyCaseInput[] = [];
  const entry = (kind: "HEARING" | "ORDER" | "STATUS_CHANGE", title: string, body: string | null, eventDate: Date | null) =>
    timeline.push({
      kind,
      title,
      body: body ? `${body}\n\nFrom the court's record on eCourts.` : "From the court's record on eCourts.",
      eventDate,
      visibility: "CLIENT",
      authorUserId: author.userId ?? null,
      authorClientId: author.clientId ?? null,
    });

  if (record.nextHearingDate && !record.disposed && !sameDay(record.nextHearingDate, current.nextHearingDate)) {
    entry("HEARING", `Next hearing listed for ${shortDate(record.nextHearingDate)}`, record.nextHearingPurpose, record.nextHearingDate);
    changes.push(`Next hearing: ${shortDate(record.nextHearingDate)}`);
  }

  if (record.stage && record.stage !== current.courtStage) {
    changes.push(`Stage: ${record.stage}`);
  }

  if (record.disposed && !["DISPOSED", "CLOSED", "WITHDRAWN"].includes(current.status)) {
    data.status = "DISPOSED";
    data.stage = "DISPOSED";
    const when = record.disposalDate ? ` on ${shortDate(record.disposalDate)}` : "";
    entry("STATUS_CHANGE", `Disposed by the court${when}`, record.disposalNature, record.disposalDate);
    changes.push("Disposed");
  }

  const known = new Set(current.orders.map((o) => `${o.orderDate.getTime()}|${o.orderType}|${o.fileName}`));
  const newOrders = record.orders.filter((o) => !known.has(`${o.orderDate.getTime()}|${o.orderType}|${o.fileName}`));
  // A rebuild re-reads a record already announced; it does not re-announce
  // every order on it.
  for (const order of options.rebuild ? [] : newOrders) {
    entry("ORDER", `${order.orderType} dated ${shortDate(order.orderDate)}`, order.summary, order.orderDate);
  }
  if (newOrders.length) changes.push(`${newOrders.length} new order${newOrders.length === 1 ? "" : "s"}`);

  await prisma.$transaction(async (tx) => {
    await tx.case.update({
      where: { id: caseId },
      data: { ...data, updates: timeline.length ? { createMany: { data: timeline } } : undefined },
    });

    if (options.rebuild) {
      await tx.courtHearing.deleteMany({ where: { caseId } });
      await tx.courtOrder.deleteMany({ where: { caseId } });
      await tx.courtHearing.createMany({ data: record.hearings.map((h) => ({ caseId, ...h })), skipDuplicates: true });
      await tx.courtOrder.createMany({ data: record.orders.map((o) => ({ caseId, ...o })), skipDuplicates: true });
      return;
    }

    for (const hearing of record.hearings) {
      await tx.courtHearing.upsert({
        where: { caseId_hearingDate: { caseId, hearingDate: hearing.hearingDate } },
        create: { caseId, ...hearing },
        update: { purpose: hearing.purpose, judge: hearing.judge, business: hearing.business, nextDate: hearing.nextDate },
      });
    }

    if (newOrders.length) {
      await tx.courtOrder.createMany({
        data: newOrders.map((order) => ({ caseId, ...order })),
        skipDuplicates: true,
      });
    }
  });

  return { changes };
}

/**
 * Fetches the court's record for a case and applies it. Used by "Check
 * court status" on either dashboard.
 */
export async function syncCase(principal: Principal, found: { id: string; cnrNumber: string | null }) {
  if (!found.cnrNumber) return null;
  const result = await fetchCaseByCnr(found.cnrNumber);
  const snapshot = await storeSnapshot(principal, found.cnrNumber, found.id, result.data, result.requestId);
  const record = readCourtRecord(found.cnrNumber, result.data);
  const applied = await applyCourtRecord(found.id, record, {
    userId: principal.kind === "staff" ? principal.id : null,
    clientId: principal.kind === "client" ? principal.id : null,
  });
  return { requestId: result.requestId, recordChanged: snapshot.changed, ...applied };
}

/**
 * On saving a new case with a CNR: adopt the lookup made for its form, and
 * load the hearing history and orders from it — no second billed call.
 */
export async function attachCourtRecord(
  caseId: string,
  cnr: string | null | undefined,
  author: { userId?: string | null; clientId?: string | null },
) {
  if (!cnr) return;
  const snapshot = await prisma.courtSnapshot.findFirst({
    where: { cnr, caseId: null, fetchedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    orderBy: { fetchedAt: "desc" },
    select: { id: true, payload: true },
  });
  if (!snapshot) return;

  await prisma.courtSnapshot.update({ where: { id: snapshot.id }, data: { caseId } });
  await applyCourtRecord(caseId, readCourtRecord(cnr, snapshot.payload), author);
}

/**
 * Re-reads the latest stored response for a case, without calling eCourts
 * (so without spending a credit). For when this file learns to read a field
 * it missed before: the hearings and orders are rebuilt from the snapshot.
 */
export async function rebuildFromSnapshot(caseId: string, author: { userId?: string | null; clientId?: string | null }) {
  const found = await prisma.case.findUniqueOrThrow({ where: { id: caseId }, select: { cnrNumber: true } });
  const snapshot = await prisma.courtSnapshot.findFirst({
    where: { caseId },
    orderBy: { fetchedAt: "desc" },
    select: { cnr: true, payload: true },
  });
  if (!snapshot) return null;
  const record = readCourtRecord(found.cnrNumber ?? snapshot.cnr, snapshot.payload);
  const applied = await applyCourtRecord(caseId, record, author, { rebuild: true });
  return { ...applied, hearings: record.hearings.length, orders: record.orders.length };
}
