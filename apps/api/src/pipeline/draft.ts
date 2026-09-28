import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { HttpError } from "../lib/http.js";
import { blockSchema, freeSlug, readingTime } from "../routes/articles.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Article drafts written by Gemini, for a lawyer to review and publish.
 *
 * One function serves every way a draft is asked for: the morning's top
 * trending judgments, "write now" on an urgent lead, and a topic an admin
 * types in. Gemini researches with Google Search (its sources are kept with
 * the draft) and answers in the editor's block format. Nothing is ever
 * published from here: every draft lands as In review.
 */

export const geminiConfigured = () => Boolean(env.GEMINI_API_KEY);
export const geminiModel = () => env.GEMINI_MODEL;

const PRACTICES: Record<string, string> = {
  "banking-finance": "Banking & Finance",
  "corporate-ma": "Corporate Advisory",
  litigation: "Litigation",
  "dispute-resolution": "Alternative Dispute Resolution",
  "real-estate-infrastructure": "Real Estate & Infrastructure",
  "labour-employment": "Labour & Employment",
  taxation: "Taxation",
  "intellectual-property": "Intellectual Property",
  "regulatory-environmental": "Regulatory & Environmental Law",
};

const SYSTEM = `You write articles for the Insights section of ADOORA Legal Services, a law firm in Hyderabad, India.
Readers are business owners, individuals and in-house counsel — intelligent, not lawyers.

Rules you must follow:
- India's Bar Council rules forbid advertising: write to inform. No "contact us", no praise of the firm, no superlatives ("best", "leading", "top"), no promises of outcomes.
- Be accurate. Use Google Search to find the judgment or development and report only what the sources support. Name the court, the bench where known, the case title and the date. If something is not known, leave it out rather than guess.
- Never name a victim of a sexual offence, a child, or parties in a matrimonial or in-camera matter; describe them ("the complainant", "the minor").
- Do not comment on the merits of a pending case beyond what the court said.
- Plain English, short paragraphs, Indian spellings and legal usage (e.g. "judgment", "advocate", "anticipatory bail").
- Structure: a two-sentence opening that says what happened and why it matters; then sections with headings ("What the court decided", "Why it matters", "What changes in practice", "Key takeaways"-style), 700–1,100 words in all.

Answer with ONE JSON object and nothing else:
{
  "title": "headline, 50–65 characters, includes the focus keyword",
  "summary": "meta description, 130–160 characters, includes the focus keyword",
  "focusKeyword": "the main search phrase, 2–5 words",
  "keywords": ["3–6 related search phrases"],
  "category": "Judgment" | "Regulatory Update" | "Explainer",
  "practices": ["practice-area slugs from the list given"],
  "keyTakeaways": ["3–5 one-sentence takeaways"],
  "body": [ { "type": "p" | "h2" | "h3" | "quote", "text": "…" } | { "type": "ul" | "ol", "items": ["…"] } ],
  "citation": "Case title, court, date — as precisely as the sources allow",
  "sources": [ { "title": "…", "url": "…" } ]
}`;

const draftSchema = z.object({
  title: z.string().trim().min(10).max(200),
  summary: z.string().trim().min(40).max(400),
  focusKeyword: z.string().trim().max(100).optional().default(""),
  keywords: z.array(z.string().trim().max(100)).max(12).optional().default([]),
  category: z.string().trim().max(60).optional().default("Judgment"),
  practices: z.array(z.string()).max(10).optional().default([]),
  keyTakeaways: z.array(z.string().trim().max(400)).max(8).optional().default([]),
  body: z.array(z.unknown()).min(3).max(200),
  citation: z.string().trim().max(400).optional(),
  sources: z.array(z.object({ title: z.string().max(300).optional(), url: z.string().max(1000) })).max(20).optional().default([]),
});

/** Words that mean the draft must be checked for names that cannot be published. */
const SENSITIVE = /rape|sexual (assault|offence|harassment)|POCSO|minor\b|child|juvenile|molest|acid attack|matrimonial|divorce|custody|in[- ]camera/i;

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1];
  const raw = fenced ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON in the answer");
  return JSON.parse(raw.slice(start, end + 1));
}

type GeminiReply = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
    finishReason?: string;
  }[];
  error?: { message?: string; status?: string };
};

async function askGemini(prompt: string) {
  if (!env.GEMINI_API_KEY) throw new HttpError(503, "AI drafting is not set up yet — add GEMINI_API_KEY on Railway.", "gemini_unconfigured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (error) {
    logger.error({ err: error }, "Gemini unreachable");
    throw new HttpError(504, "The AI service did not respond. Please try again.", "gemini_unreachable");
  }
  const body = (await response.json().catch(() => null)) as GeminiReply | null;
  if (!response.ok || !body) {
    logger.error({ status: response.status, error: body?.error?.message?.slice(0, 200) }, "Gemini refused the request");
    throw new HttpError(502, response.status === 400 || response.status === 404 ? `The AI model "${env.GEMINI_MODEL}" was not accepted — check GEMINI_MODEL.` : "The AI service could not write the draft. Please try again.", "gemini_failed");
  }
  const candidate = body.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const grounding = (candidate?.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => ({ title: chunk.web?.title ?? "", url: chunk.web?.uri ?? "" }))
    .filter((source) => source.url);
  return { text, grounding };
}

export type DraftRequest = {
  topic: string;
  /** The lead it comes from, if any: its headlines and links go in as starting points. */
  leadId?: string;
  /** Who asked, for the audit trail; null for the morning run. */
  requestedBy?: { id: string; name: string } | null;
  auto?: boolean;
};

export async function draftArticle(request: DraftRequest) {
  const lead = request.leadId ? await prisma.trendingLead.findUnique({ where: { id: request.leadId } }) : null;
  const leadSources = ((lead?.sources ?? []) as { outlet: string; title: string; url: string }[]).slice(0, 12);

  const prompt = [
    `Write an article on: ${request.topic.trim()}`,
    lead?.court ? `Court: ${lead.court}.` : "",
    leadSources.length
      ? `Reported so far (headlines only — find and read the underlying judgment or primary source):\n${leadSources.map((s) => `- ${s.outlet}: ${s.title} (${s.url})`).join("\n")}`
      : "",
    `Practice-area slugs you may use: ${Object.entries(PRACTICES).map(([slug, name]) => `${slug} (${name})`).join(", ")}.`,
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const answer = await askGemini(prompt);
  let parsed: z.infer<typeof draftSchema>;
  try {
    parsed = draftSchema.parse(parseJson(answer.text));
  } catch (error) {
    logger.warn({ err: error, sample: answer.text.slice(0, 300) }, "Gemini's draft could not be read");
    throw new HttpError(502, "The AI's draft came back in a form we could not read. Please try again.", "gemini_bad_draft");
  }

  // Keep only blocks the editor understands; drop anything else.
  const body = parsed.body
    .map((block) => blockSchema.safeParse(block))
    .filter((result) => result.success)
    .map((result) => result.data!)
    .filter((block) => block.type !== "image");
  if (body.length < 3) throw new HttpError(502, "The AI's draft was too thin to use. Please try again.", "gemini_bad_draft");

  const allText = `${parsed.title} ${parsed.summary} ${JSON.stringify(body)}`;
  const warnings = SENSITIVE.test(allText)
    ? ["This story may involve a victim, a child or a family matter — check that nobody who must stay anonymous is named."]
    : [];

  const slug = await freeSlug(parsed.title);
  const article = await prisma.article.create({
    data: {
      slug,
      title: parsed.title,
      summary: parsed.summary,
      category: ["Judgment", "Regulatory Update", "Explainer"].includes(parsed.category) ? parsed.category : "Judgment",
      body: body as Prisma.InputJsonValue,
      readingTime: readingTime(body),
      keyTakeaways: parsed.keyTakeaways,
      practices: parsed.practices.filter((slug) => slug in PRACTICES),
      industries: [],
      focusKeyword: parsed.focusKeyword || null,
      keywords: [...new Set(parsed.keywords)],
      status: "REVIEW",
      source: "PIPELINE",
      sourceMeta: {
        topic: request.topic,
        requestedBy: request.requestedBy?.name ?? (request.auto ? "Morning run" : null),
        auto: Boolean(request.auto),
        citation: parsed.citation ?? null,
        court: lead?.court ?? null,
        headlines: leadSources.map((s) => `${s.outlet}: ${s.title} — ${s.url}`),
        sources: [...parsed.sources, ...answer.grounding].slice(0, 20).map((s) => `${s.title ? `${s.title} — ` : ""}${s.url}`),
        checks: warnings,
        model: env.GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
    select: { id: true, slug: true, title: true },
  });

  if (lead) await prisma.trendingLead.update({ where: { id: lead.id }, data: { status: "DRAFTED", articleId: article.id } });
  logger.info({ articleId: article.id, lead: lead?.id ?? null, auto: Boolean(request.auto) }, "Article drafted by AI");
  return article;
}

/** Start of today in India (the morning run counts its drafts from here). */
export function startOfTodayIst() {
  const ist = new Date(Date.now() + 5.5 * 3_600_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * 3_600_000);
}

export const DAILY_AUTO_DRAFTS = 3;
/** Leads below this score are not worth an automatic draft. */
export const AUTO_DRAFT_MIN_SCORE = 6;

/** The morning run: up to three drafts from the best unwritten leads of the last two days. */
export async function morningDrafts() {
  if (!geminiConfigured()) return { drafted: 0, skipped: "no key" };
  const done = await prisma.article.count({
    where: { source: "PIPELINE", createdAt: { gte: startOfTodayIst() }, sourceMeta: { path: ["auto"], equals: true } },
  });
  const room = DAILY_AUTO_DRAFTS - done;
  if (room <= 0) return { drafted: 0, skipped: "done for today" };

  const leads = await prisma.trendingLead.findMany({
    where: {
      status: { in: ["URGENT", "SHORTLISTED", "NEW"] },
      score: { gte: AUTO_DRAFT_MIN_SCORE },
      lastSeenAt: { gte: new Date(Date.now() - 48 * 3_600_000) },
    },
    orderBy: [{ status: "asc" }, { score: "desc" }],
    take: room,
  });

  let drafted = 0;
  for (const lead of leads) {
    try {
      await draftArticle({ topic: lead.title, leadId: lead.id, auto: true });
      drafted++;
    } catch (error) {
      logger.warn({ err: error, lead: lead.id }, "Morning draft failed");
    }
  }
  return { drafted };
}
