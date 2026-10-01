import { readdir, readFile } from "node:fs/promises";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { DEFAULT_DOC_PAGES } from "../docs/default-pages.js";

/**
 * The firm's documentation, in the admin console (Documentation). Everyone
 * who can open the console reads it; owners and admins edit it. One row per
 * chapter, in Markdown; pictures are `DocImage` rows, referenced from the
 * Markdown as `docimg:<id>`.
 *
 * The first time it is opened the guide in `docs/default-pages.ts` is seeded,
 * with its screenshots from `apps/api/docs-seed/`.
 */
export const docsRouter = Router();

const readers = [requireAuth, requireRole("OWNER", "ADMIN", "EDITOR")];
const editors = [requireAuth, requireRole("OWNER", "ADMIN")];

const SEED_DIR = new URL("../../docs-seed/", import.meta.url);

const pageSelect = { id: true, title: true, body: true, position: true, updatedAt: true, updatedByName: true } as const;

/** Seeds the bundled guide once: never again after anything has been seeded, even if every chapter is deleted later. */
async function seedIfEmpty() {
  if (await prisma.docPage.count()) return;
  await prisma.$transaction(
    async (tx) => {
      // Two console tabs opening at once must not both seed.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(724001)`;
      if ((await tx.docPage.count()) || (await tx.docImage.count({ where: { name: { not: null } } }))) return;

      const ids = new Map<string, string>();
      const files = await readdir(SEED_DIR).catch(() => [] as string[]);
      for (const file of files.filter((f) => f.endsWith(".png"))) {
        const data = await readFile(new URL(file, SEED_DIR));
        const image = await tx.docImage.create({
          data: { name: file.replace(/\.png$/, ""), data: new Uint8Array(data), mimeType: "image/png", bytes: data.length },
          select: { id: true, name: true },
        });
        ids.set(image.name!, image.id);
      }

      await tx.docPage.createMany({
        data: DEFAULT_DOC_PAGES.map((page, index) => ({
          title: page.title,
          // A screenshot that is not bundled is dropped rather than left broken.
          body: page.body.replace(/!\[([^\]]*)\]\(docimg:([a-z0-9-]+)\)/g, (_, alt: string, name: string) =>
            ids.has(name) ? `![${alt}](docimg:${ids.get(name)})` : "",
          ),
          position: index + 1,
          updatedByName: "ADOORA guide",
        })),
      });
    },
    { timeout: 30_000 },
  );
}

docsRouter.get("/docs", ...readers, async (req, res) => {
  await seedIfEmpty();
  const pages = await prisma.docPage.findMany({ orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: pageSelect });
  res.json({ pages, canEdit: req.auth!.role === "OWNER" || req.auth!.role === "ADMIN" });
});

const pageBody = z.object({
  title: z.string().trim().min(1, "Give the chapter a title.").max(200),
  body: z.string().max(200_000, "This chapter is too long; split it into two."),
});

function editorName(req: Parameters<RequestHandler>[0]) {
  return req.principal?.name ?? null;
}

docsRouter.post("/docs", ...editors, async (req, res) => {
  const input = pageBody.partial({ body: true }).parse(req.body);
  const last = await prisma.docPage.aggregate({ _max: { position: true } });
  const page = await prisma.docPage.create({
    data: {
      title: input.title,
      body: input.body ?? "",
      position: (last._max.position ?? 0) + 1,
      updatedById: req.auth!.sub,
      updatedByName: editorName(req),
    },
    select: pageSelect,
  });
  await audit(req, "docs.page_created", "DocPage", page.id, { title: page.title });
  res.status(201).json({ page });
});

docsRouter.put("/docs/:id", ...editors, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const input = pageBody.extend({ expectedUpdatedAt: z.string().datetime() }).parse(req.body);

  // Someone else saved since this editor opened the chapter: do not overwrite them.
  const { count } = await prisma.docPage.updateMany({
    where: { id, updatedAt: new Date(input.expectedUpdatedAt) },
    data: { title: input.title, body: input.body, updatedById: req.auth!.sub, updatedByName: editorName(req) },
  });
  if (!count) {
    const exists = await prisma.docPage.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new HttpError(404, "This chapter has been deleted.", "not_found");
    throw new HttpError(409, "Someone else saved this chapter while you were editing. Copy your changes, reload, and apply them again.", "edit_conflict");
  }
  const page = await prisma.docPage.findUniqueOrThrow({ where: { id }, select: pageSelect });
  await audit(req, "docs.page_updated", "DocPage", id, { title: page.title });
  res.json({ page });
});

docsRouter.delete("/docs/:id", ...editors, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const page = await prisma.docPage.delete({ where: { id }, select: { title: true } }).catch(() => null);
  if (!page) throw new HttpError(404, "This chapter has already been deleted.", "not_found");
  await audit(req, "docs.page_deleted", "DocPage", id, { title: page.title });
  res.json({ ok: true });
});

/** POST /api/admin/docs/order {ids} — the chapters in their new order. */
docsRouter.post("/docs/order", ...editors, async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(req.body);
  await prisma.$transaction(ids.map((id, index) => prisma.docPage.updateMany({ where: { id }, data: { position: index + 1 } })));
  res.json({ ok: true });
});

// Pictures -----------------------------------------------------------------

const MAX_IMAGE_MB = 5;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_MB * 1024 * 1024, files: 1 } });
const imageMiddleware: RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooBig = error.code === "LIMIT_FILE_SIZE";
      next(new HttpError(tooBig ? 413 : 400, tooBig ? `Pictures can be up to ${MAX_IMAGE_MB} MB.` : "The picture could not be read.", "bad_image"));
      return;
    }
    next(error as Error | undefined);
  });
};

/** By the file's own bytes, never its name or the browser's word for it. */
function imageType(buffer: Buffer): string | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  return null;
}

docsRouter.post("/docs/images", ...editors, imageMiddleware, async (req, res) => {
  const file = req.file;
  if (!file) throw new HttpError(400, "Please choose a picture.", "no_file");
  const type = imageType(file.buffer);
  if (!type) throw new HttpError(415, "Please upload a JPEG, PNG, WebP or GIF picture.", "bad_image");
  const image = await prisma.docImage.create({
    data: { data: new Uint8Array(file.buffer), mimeType: type, bytes: file.size },
    select: { id: true },
  });
  res.status(201).json({ id: image.id });
});

docsRouter.get("/docs/images/:id", ...readers, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const image = await prisma.docImage.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  if (!image) throw new HttpError(404, "No picture.", "not_found");
  res.set({ "Content-Type": image.mimeType, "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" });
  res.end(Buffer.from(image.data));
});
