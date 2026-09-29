import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateCoverImage, imageEstimate, suggestCoverPrompt } from "../pipeline/cover-image.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Articles for the website's Insights section, written in the console (and,
 * later, drafted by the judgments pipeline for a person to review).
 *
 *   articlesPublicRouter  /api/public/articles…   published only, cacheable
 *   articlesAdminRouter   /api/admin/articles…    OWNER / ADMIN
 *
 * The body is a list of blocks — the same small vocabulary the website's
 * bundled articles use (paragraph, headings, lists, quote) plus images.
 * Structured blocks rather than HTML: nothing a writer types can inject
 * markup into the public page.
 */
export const articlesPublicRouter = Router();
export const articlesAdminRouter = Router();

const adminOnly = [requireAuth, requireRole("OWNER", "ADMIN")];

// ---------------------------------------------------------------------------
// Shapes
// ---------------------------------------------------------------------------

const line = (max: number) => z.string().trim().min(1).max(max);

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: line(8000) }),
  z.object({ type: z.literal("h2"), text: line(200) }),
  z.object({ type: z.literal("h3"), text: line(200) }),
  z.object({ type: z.literal("ul"), items: z.array(line(1000)).min(1).max(50) }),
  z.object({ type: z.literal("ol"), items: z.array(line(1000)).min(1).max(50) }),
  z.object({ type: z.literal("quote"), text: line(2000) }),
  z.object({
    type: z.literal("image"),
    imageId: z.string().uuid(),
    alt: z.string().trim().max(300).default(""),
    caption: z.string().trim().max(300).optional(),
  }),
]);

type Block = z.infer<typeof blockSchema>;

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value?.trim() ? value.trim() : null))
    .pipe(z.string().max(max).nullable().optional());

const list = (maxItems: number, maxLength: number) =>
  z
    .array(z.string())
    .max(maxItems)
    .optional()
    .transform((items) => (items ? [...new Set(items.map((item) => item.trim()).filter(Boolean))] : undefined))
    .pipe(z.array(z.string().max(maxLength)).optional());

const articleSchema = z.object({
  title: z.string().trim().min(5, "Please give the article a title.").max(200),
  slug: optionalText(100),
  category: z.string().trim().min(2).max(60).default("Explainer"),
  summary: z.string().trim().max(400).default(""),
  body: z.array(blockSchema).max(400).default([]),
  keyTakeaways: list(8, 400),
  practices: list(10, 80),
  industries: list(10, 80),
  authorSlug: optionalText(80),
  metaTitle: optionalText(120),
  focusKeyword: optionalText(100),
  keywords: list(20, 100),
  coverImageId: z.union([z.string().uuid(), z.null()]).optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

const articleUpdateSchema = articleSchema.partial();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export async function freeSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || "article";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const taken = await prisma.article.findFirst({ where: { slug: candidate, NOT: exceptId ? { id: exceptId } : undefined }, select: { id: true } });
    if (!taken) return candidate;
  }
  throw new HttpError(409, "Could not find a free web address for this article.", "slug_taken");
}

function wordsIn(blocks: Block[]): number {
  const text = blocks
    .map((block) => ("text" in block ? block.text : "items" in block ? block.items.join(" ") : block.caption ?? ""))
    .join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

/** "6 min read", at 200 words a minute. */
export const readingTime = (blocks: Block[]) => `${Math.max(1, Math.round(wordsIn(blocks) / 200))} min read`;

const listSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  summary: true,
  status: true,
  source: true,
  keywords: true,
  focusKeyword: true,
  authorSlug: true,
  coverImageId: true,
  readingTime: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect;

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

const publicImageUrl = (id: string | null) => (id ? `/api/public/article-images/${id}` : null);

articlesPublicRouter.get("/public/articles", async (_req, res) => {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { ...listSelect, practices: true, industries: true, keyTakeaways: true },
    take: 200,
  });
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({
    data: rows.map(({ status: _s, source: _src, createdAt: _c, ...row }) => ({ ...row, coverUrl: publicImageUrl(row.coverImageId) })),
  });
});

articlesPublicRouter.get("/public/articles/:slug", async (req, res) => {
  const found = await prisma.article.findFirst({
    where: { slug: String(req.params.slug), status: "PUBLISHED" },
    select: { ...listSelect, body: true, practices: true, industries: true, keyTakeaways: true, metaTitle: true },
  });
  if (!found) throw new HttpError(404, "Article not found.", "not_found");
  const { status: _s, source: _src, createdAt: _c, ...row } = found;
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ ...row, coverUrl: publicImageUrl(row.coverImageId) });
});

articlesPublicRouter.get("/public/article-images/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new HttpError(404, "No image.", "not_found");
  const image = await prisma.articleImage.findFirst({
    where: { id: id.data, article: { status: "PUBLISHED" } },
    select: { data: true, mimeType: true },
  });
  if (!image) throw new HttpError(404, "No image.", "not_found");
  res.set({ "Content-Type": image.mimeType, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" });
  res.end(Buffer.from(image.data));
});

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

articlesAdminRouter.get("/articles", ...adminOnly, async (_req, res) => {
  const rows = await prisma.article.findMany({ orderBy: { updatedAt: "desc" }, select: listSelect, take: 500 });
  res.json({ data: rows });
});

/** Registered before /articles/:id, which would otherwise take the path. GET /api/admin/articles/cover-generator — is it set up, which model, what one image costs. */
articlesAdminRouter.get("/articles/cover-generator", ...adminOnly, (_req, res) => {
  res.json(imageEstimate());
});

articlesAdminRouter.get("/articles/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const found = await prisma.article.findUnique({
    where: { id },
    select: {
      ...listSelect,
      body: true,
      keyTakeaways: true,
      practices: true,
      industries: true,
      metaTitle: true,
      sourceMeta: true,
      images: { select: { id: true, mimeType: true, bytes: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!found) throw new HttpError(404, "Article not found.", "not_found");
  res.json(found);
});

articlesAdminRouter.post("/articles", ...adminOnly, async (req, res) => {
  const input = articleSchema.parse(req.body);
  const slug = await freeSlug(input.slug ?? input.title);
  const created = await prisma.article.create({
    data: {
      ...input,
      slug,
      body: input.body as Prisma.InputJsonValue,
      readingTime: readingTime(input.body),
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      authorId: req.principal!.id,
    },
    select: { id: true, slug: true },
  });
  await audit(req, "article.create", "Article", created.id, { slug, status: input.status });
  res.status(201).json(created);
});

articlesAdminRouter.patch("/articles/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const input = articleUpdateSchema.parse(req.body);
  const current = await prisma.article.findUnique({ where: { id }, select: { status: true, publishedAt: true, slug: true } });
  if (!current) throw new HttpError(404, "Article not found.", "not_found");

  if (input.coverImageId) {
    const own = await prisma.articleImage.findFirst({ where: { id: input.coverImageId, articleId: id }, select: { id: true } });
    if (!own) throw new HttpError(400, "That cover image belongs to another article.", "bad_cover");
  }

  const data: Prisma.ArticleUpdateInput = {
    ...input,
    slug: input.slug !== undefined && input.slug !== current.slug ? await freeSlug(input.slug ?? input.title ?? current.slug, id) : undefined,
    body: input.body ? (input.body as Prisma.InputJsonValue) : undefined,
    readingTime: input.body ? readingTime(input.body) : undefined,
    // The first publication sets the date; unpublishing and republishing keeps it.
    publishedAt: input.status === "PUBLISHED" && !current.publishedAt ? new Date() : undefined,
  };
  const updated = await prisma.article.update({ where: { id }, data, select: { id: true, slug: true, status: true } });
  if (input.status && input.status !== current.status) {
    await audit(req, "article.status", "Article", id, { from: current.status, to: input.status });
  }
  res.json(updated);
});

articlesAdminRouter.delete("/articles/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const removed = await prisma.article.delete({ where: { id }, select: { slug: true } }).catch(() => null);
  if (!removed) throw new HttpError(404, "Article not found.", "not_found");
  await audit(req, "article.delete", "Article", id, { slug: removed.slug });
  res.json({ ok: true });
});

// Images -------------------------------------------------------------------

const MAX_IMAGE_MB = 5;
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 } });
const imageMiddleware: RequestHandler = (req, res, next) => {
  imageUpload.single("image")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooBig = error.code === "LIMIT_FILE_SIZE";
      next(new HttpError(tooBig ? 413 : 400, tooBig ? `Images can be up to ${MAX_IMAGE_MB} MB.` : "The image could not be read.", "bad_image"));
      return;
    }
    next(error as Error | undefined);
  });
};

/** JPEG, PNG, WebP or GIF, by their magic bytes rather than the file name. */
function imageType(buffer: Buffer): string | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  return null;
}

articlesAdminRouter.post("/articles/:id/images", ...adminOnly, imageMiddleware, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const file = req.file;
  if (!file) throw new HttpError(400, "Please choose an image.", "no_file");
  const type = imageType(file.buffer);
  if (!type) throw new HttpError(415, "Please upload a JPEG, PNG, WebP or GIF image.", "bad_image");
  const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Article not found.", "not_found");

  const image = await prisma.articleImage.create({
    data: { articleId: id, data: new Uint8Array(file.buffer), mimeType: type, bytes: file.size },
    select: { id: true },
  });
  res.status(201).json({ id: image.id });
});

// ---------------------------------------------------------------------------
// Cover images drawn by Gemini — only ever on an editor's click
// ---------------------------------------------------------------------------

const coverBriefSchema = z.object({
  title: z.string().trim().min(3).max(300),
  summary: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(60).optional(),
  practices: z.array(z.string().trim().max(80)).max(12).optional(),
  headings: z.array(z.string().trim().max(200)).max(30).optional(),
  excerpt: z.string().trim().max(4000).optional(),
});

/** POST /api/admin/articles/:id/cover-prompt — the article (as it stands in the editor) → an image prompt. */
articlesAdminRouter.post("/articles/:id/cover-prompt", ...adminOnly, async (req, res) => {
  z.string().uuid().parse(req.params.id);
  const prompt = await suggestCoverPrompt(coverBriefSchema.parse(req.body));
  res.json({ prompt });
});

/** POST /api/admin/articles/:id/cover-generate {prompt} — draws it and files it with the article's images. */
articlesAdminRouter.post("/articles/:id/cover-generate", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const { prompt } = z.object({ prompt: z.string().trim().min(20, "Describe the picture in a sentence or two.").max(3000) }).parse(req.body);
  const exists = await prisma.article.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(404, "Article not found.", "not_found");

  const image = await generateCoverImage(prompt);
  if (image.data.length > MAX_IMAGE_MB * 1024 * 1024 || !imageType(image.data)) {
    throw new HttpError(502, "The generated image could not be used. Please try again.", "bad_image");
  }
  const saved = await prisma.articleImage.create({
    data: { articleId: id, data: new Uint8Array(image.data), mimeType: imageType(image.data)!, bytes: image.data.length },
    select: { id: true },
  });
  await audit(req, "article.cover_generated", "Article", id, { imageId: saved.id, model: image.model, costUsd: image.costUsd });
  res.status(201).json({ id: saved.id, model: image.model, costUsd: image.costUsd });
});

/** Images of any article, published or not — for the editor and its preview. */
articlesAdminRouter.get("/articles/:id/images/:imageId", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const imageId = z.string().uuid().parse(req.params.imageId);
  const image = await prisma.articleImage.findFirst({ where: { id: imageId, articleId: id }, select: { data: true, mimeType: true } });
  if (!image) throw new HttpError(404, "No image.", "not_found");
  res.set({ "Content-Type": image.mimeType, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" });
  res.end(Buffer.from(image.data));
});

articlesAdminRouter.delete("/articles/:id/images/:imageId", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const imageId = z.string().uuid().parse(req.params.imageId);
  await prisma.articleImage.deleteMany({ where: { id: imageId, articleId: id } });
  await prisma.article.updateMany({ where: { id, coverImageId: imageId }, data: { coverImageId: null } });
  res.json({ ok: true });
});
