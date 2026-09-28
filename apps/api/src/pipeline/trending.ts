import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { readAllFeeds, type FeedItem } from "./feeds.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Finds the judgments the legal press is talking about.
 *
 * Every run reads the feeds, keeps the items about Indian courts, and groups
 * items about the same story into one lead (same parties "X v. Y", or mostly
 * the same key words). A lead is scored the way the trade marks a story as
 * trending — how many separate outlets carry it — plus the court's weight,
 * a larger bench, and whether it touches the firm's practice areas or the
 * keywords its articles target. The score fades over two days.
 *
 * A lead that crosses the urgent line is marked URGENT: the console shows it
 * as "write today".
 */

const COURT_PATTERNS: [RegExp, string, "SC" | "HC" | "OTHER"][] = [
  [/\bsupreme court\b|\bSC\b|\bCJI\b/i, "Supreme Court", "SC"],
  [/telangana (high court|hc)|\bTS ?HC\b|\bTGHC\b/i, "Telangana High Court", "HC"],
  [/andhra pradesh (high court|hc)|\bAP ?HC\b/i, "Andhra Pradesh High Court", "HC"],
  [/karnataka (high court|hc)/i, "Karnataka High Court", "HC"],
  [/madras (high court|hc)/i, "Madras High Court", "HC"],
  [/delhi (high court|hc)/i, "Delhi High Court", "HC"],
  [/bombay (high court|hc)/i, "Bombay High Court", "HC"],
  [/kerala (high court|hc)/i, "Kerala High Court", "HC"],
  [/allahabad (high court|hc)/i, "Allahabad High Court", "HC"],
  [/(calcutta|gujarat|rajasthan|punjab (and|&) haryana|orissa|patna|gauhati|jharkhand|chhattisgarh|uttarakhand|himachal|jammu|madhya pradesh|tripura|meghalaya|manipur|sikkim) (high court|hc)/i, "High Court", "HC"],
  [/\bhigh court\b|\bHC\b/i, "High Court", "HC"],
  [/\bNCLAT\b|\bNCLT\b|\bNGT\b|\bITAT\b|\bCESTAT\b|\bSAT\b|tribunal|commission/i, "Tribunal", "OTHER"],
];

/** Stories that are not about Indian courts (Google News mixes in the US). */
const FOREIGN = /\bU\.?S\.? supreme court|\bUS court\b|america|trump|roberts court|federal judge|\bUK supreme court|pakistan|bangladesh/i;

/** Practice area slug → words that put a story in it. */
const PRACTICE_WORDS: Record<string, RegExp> = {
  "banking-finance": /\bbank|loan|RBI\b|NBFC|SARFAESI|DRT\b|recovery|credit|wilful default/i,
  "corporate-ma": /compan(y|ies) act|merger|acquisition|shareholder|SEBI|director|CCI\b|competition/i,
  litigation: /bail|FIR\b|criminal|murder|cheque|section 138|writ|contempt|quash|BNSS|BNS\b|CrPC|IPC\b|UAPA|PMLA|ED\b/i,
  "dispute-resolution": /arbitrat|mediat|conciliat|section 34|section 11/i,
  "real-estate-infrastructure": /RERA|land|property|builder|homebuyer|acquisition of land|tenan|lease|infrastructure/i,
  "labour-employment": /employee|employer|labour|wages|gratuity|termination|service matter|industrial dispute|POSH|pension/i,
  taxation: /\bGST\b|income tax|tax|customs|excise|ITC\b|assessment/i,
  "intellectual-property": /trademark|copyright|patent|design|passing off|IP\b/i,
  "regulatory-environmental": /environment|pollution|NGT\b|forest|mining|licen[cs]e|regulat/i,
};

const STOP = new Set(
  "a an the of to in on for and or by with from as at is are was were be been it its this that into over under after before against not no upon who which what when why how says said holds held rules ruled court high supreme judgment order bench justice hc sc india indian case cases plea petition petitions".split(
    " ",
  ),
);

function words(title: string): string[] {
  return [...new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))];
}

/** "Ravi Kumar v. State of Telangana" → "ravi kumar|state of telangana". */
function partiesKey(title: string): string | null {
  const match = title.match(/([A-Z][\w.&' ]{2,60}?)\s+(?:v\.|vs\.?|versus)\s+([A-Z][\w.&' ]{2,60})/);
  if (!match) return null;
  const side = (value: string) => value.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim().split(" ").slice(0, 4).join(" ");
  return `v:${side(match[1]!)}|${side(match[2]!)}`;
}

/** "LiveLaw" and "Live Law" are one outlet. */
const outletKey = (outlet: string) => outlet.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(in|com|org)$/, "");

/** Round-ups and alert digests are not stories. */
const DIGEST = /news alerts|round-?up|weekly|daily digest|top stories|this week in|live updates/i;

const similarity = (a: string[], b: string[]) => {
  const setB = new Set(b);
  const shared = a.filter((w) => setB.has(w)).length;
  return shared / Math.max(1, Math.min(a.length, b.length));
};

type Source = { outlet: string; title: string; url: string; publishedAt: string };

function courtOf(text: string) {
  for (const [pattern, name, level] of COURT_PATTERNS) if (pattern.test(text)) return { court: name, level };
  return null;
}

function score(lead: { sources: Source[]; courtLevel: string; practices: string[]; firstSeenAt: Date; title: string }, targets: string[]) {
  const outlets = new Set(lead.sources.map((s) => outletKey(s.outlet))).size;
  const text = lead.sources.map((s) => s.title).join(" ");
  let points = outlets * 3;
  points += lead.courtLevel === "SC" ? 3 : lead.courtLevel === "HC" ? 2 : 1;
  if (/constitution bench|larger bench|full bench|(three|five|seven|nine)[- ]judge/i.test(text)) points += 2;
  if (lead.practices.length) points += 2;
  if (targets.some((keyword) => text.toLowerCase().includes(keyword))) points += 2;
  const hours = (Date.now() - lead.firstSeenAt.getTime()) / 3_600_000;
  return Math.round(points * Math.max(0.3, 1 - hours / 48) * 10) / 10;
}

/** Four or more outlets within six hours of first sighting, or a very high score. */
function isUrgent(lead: { sources: Source[]; firstSeenAt: Date }, value: number) {
  const early = lead.sources.filter((s) => new Date(s.publishedAt).getTime() - lead.firstSeenAt.getTime() < 6 * 3_600_000);
  return new Set(early.map((s) => outletKey(s.outlet))).size >= 4 || value >= 16;
}

export async function discoverTrending() {
  const started = Date.now();
  const items = (await readAllFeeds()).filter((item) => {
    if (Date.now() - item.publishedAt.getTime() > 72 * 3_600_000) return false;
    if (FOREIGN.test(item.title) || DIGEST.test(item.title)) return false;
    return Boolean(courtOf(item.title)) || /judgment|verdict|\bruling\b|acquit|convict|bail|quash/i.test(item.title);
  });

  const targets = (
    await prisma.article.findMany({ where: { status: { in: ["PUBLISHED", "REVIEW", "DRAFT"] } }, select: { keywords: true, focusKeyword: true } })
  )
    .flatMap((a) => [...a.keywords, a.focusKeyword ?? ""])
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 3);

  const recent = await prisma.trendingLead.findMany({
    where: { lastSeenAt: { gte: new Date(Date.now() - 72 * 3_600_000) } },
  });
  type Working = (typeof recent)[number] & { words: string[]; dirty: boolean; fresh: boolean };
  const leads: Working[] = recent.map((lead) => ({ ...lead, words: words(lead.title), dirty: false, fresh: false }));

  for (const item of items) {
    const itemWords = words(item.title);
    if (itemWords.length < 3) continue;
    const parties = partiesKey(item.title);
    const found =
      (parties && leads.find((lead) => lead.key === parties)) ??
      leads.find((lead) => similarity(itemWords, lead.words) >= 0.6);

    const source: Source = { outlet: item.outlet, title: item.title, url: item.url, publishedAt: item.publishedAt.toISOString() };
    if (found) {
      const sources = found.sources as Source[];
      if (sources.some((s) => s.url === source.url || (outletKey(s.outlet) === outletKey(source.outlet) && s.title === source.title))) continue;
      found.sources = [...sources, source].slice(0, 40) as Prisma.JsonValue;
      found.words = [...new Set([...found.words, ...itemWords])].slice(0, 60);
      found.lastSeenAt = new Date();
      found.dirty = true;
      continue;
    }

    const court = courtOf(item.title);
    leads.push({
      id: "",
      key: parties ?? `w:${itemWords.slice(0, 8).sort().join(" ")}`,
      title: item.title,
      court: court?.court ?? null,
      courtLevel: court?.level ?? "OTHER",
      sources: [source] as Prisma.JsonValue,
      outlets: 1,
      score: 0,
      practices: Object.entries(PRACTICE_WORDS)
        .filter(([, pattern]) => pattern.test(item.title))
        .map(([slug]) => slug),
      status: "NEW",
      articleId: null,
      firstSeenAt: item.publishedAt < new Date() ? item.publishedAt : new Date(),
      lastSeenAt: new Date(),
      urgentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      words: itemWords,
      dirty: true,
      fresh: true,
    });
  }

  let created = 0;
  let urgent = 0;
  for (const lead of leads) {
    const sources = lead.sources as Source[];
    const value = score({ ...lead, sources }, targets);
    const outlets = new Set(sources.map((s) => outletKey(s.outlet))).size;
    const becomesUrgent = (lead.status === "NEW" || lead.status === "SHORTLISTED") && isUrgent({ sources, firstSeenAt: lead.firstSeenAt }, value);
    if (!lead.dirty && value === lead.score && !becomesUrgent) continue;
    const data = {
      title: lead.title,
      court: lead.court,
      courtLevel: lead.courtLevel,
      sources: sources as Prisma.InputJsonValue,
      outlets,
      score: value,
      practices: lead.practices,
      lastSeenAt: lead.lastSeenAt,
      ...(becomesUrgent ? { status: "URGENT" as const, urgentAt: new Date() } : {}),
    };
    if (becomesUrgent) urgent++;
    if (lead.fresh) {
      await prisma.trendingLead.upsert({
        where: { key: lead.key },
        create: { key: lead.key, firstSeenAt: lead.firstSeenAt, ...data },
        update: data,
      });
      created++;
    } else {
      await prisma.trendingLead.update({ where: { id: lead.id }, data });
    }
  }

  const summary = { items: items.length, created, urgent, ms: Date.now() - started };
  logger.info(summary, "Trending judgments read");
  return summary;
}
