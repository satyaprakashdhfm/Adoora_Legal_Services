import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { HttpError } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { jobState, runTrending } from "../jobs/scheduler.js";
import { AUTO_DRAFT_MIN_SCORE, DAILY_AUTO_DRAFTS, draftArticle, geminiConfigured, startOfTodayIst } from "../pipeline/draft.js";

/**
 * Trending judgments and AI drafts, for the console (OWNER / ADMIN):
 *
 *   GET   /api/admin/leads            leads of the last three days, urgent first
 *   PATCH /api/admin/leads/:id        shortlist / reject
 *   POST  /api/admin/leads/refresh    read the feeds now
 *   POST  /api/admin/articles/draft   "Write now": a topic (or a lead) → an AI draft, In review
 *   GET   /api/admin/pipeline         what is set up and what ran
 */
export const leadsRouter = Router();

const adminOnly = [requireAuth, requireRole("OWNER", "ADMIN")];

/** Each draft is a paid AI call with search; a stuck button should not run up a bill. */
const draftLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `draft:${req.principal?.id ?? "anonymous"}`,
  message: { error: "rate_limited", message: "That is 30 AI drafts today — the limit resets tomorrow." },
});

leadsRouter.get("/leads", ...adminOnly, async (req, res) => {
  const all = req.query.status === "all";
  const rows = await prisma.trendingLead.findMany({
    where: {
      lastSeenAt: { gte: new Date(Date.now() - 72 * 3_600_000) },
      ...(all ? {} : { status: { in: ["URGENT", "NEW", "SHORTLISTED", "DRAFTED"] } }),
    },
    orderBy: [{ score: "desc" }],
    take: 150,
  });
  // Urgent first, then by score.
  rows.sort((a, b) => Number(b.status === "URGENT") - Number(a.status === "URGENT") || b.score - a.score);
  res.set("Cache-Control", "no-store");
  res.json({ data: rows });
});

leadsRouter.patch("/leads/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { status } = z.object({ status: z.enum(["NEW", "SHORTLISTED", "REJECTED"]) }).parse(req.body);
  const updated = await prisma.trendingLead.update({ where: { id }, data: { status } }).catch(() => null);
  if (!updated) throw new HttpError(404, "Lead not found.", "not_found");
  res.json(updated);
});

leadsRouter.post("/leads/refresh", ...adminOnly, async (req, res) => {
  const result = await runTrending();
  if (!result) throw new HttpError(409, "The feeds are being read right now — try again in a minute.", "busy");
  await audit(req, "leads.refresh", "TrendingLead", null, result);
  res.json(result);
});

const draftRequest = z.object({
  topic: z.string().trim().min(8, "Describe the topic in a few words.").max(500),
  leadId: z.string().uuid().optional(),
});

leadsRouter.post("/articles/draft", ...adminOnly, draftLimiter, async (req, res) => {
  const input = draftRequest.parse(req.body);
  const principal = req.principal!;
  const article = await draftArticle({ ...input, requestedBy: { id: principal.id, name: principal.name } });
  await audit(req, "article.ai_draft", "Article", article.id, { topic: input.topic, leadId: input.leadId ?? null });
  res.status(201).json(article);
});

leadsRouter.get("/pipeline", ...adminOnly, async (_req, res) => {
  const draftsToday = await prisma.article.count({
    where: { source: "PIPELINE", createdAt: { gte: startOfTodayIst() }, sourceMeta: { path: ["auto"], equals: true } },
  });
  const urgent = await prisma.trendingLead.count({ where: { status: "URGENT", lastSeenAt: { gte: new Date(Date.now() - 48 * 3_600_000) } } });
  res.set("Cache-Control", "no-store");
  res.json({
    gemini: geminiConfigured(),
    model: env.GEMINI_MODEL,
    jobs: env.JOBS_ENABLED !== "false",
    lastTrendingAt: jobState.lastTrendingAt,
    lastTrending: jobState.lastTrending,
    draftsToday,
    dailyLimit: DAILY_AUTO_DRAFTS,
    minScore: AUTO_DRAFT_MIN_SCORE,
    urgent,
  });
});
