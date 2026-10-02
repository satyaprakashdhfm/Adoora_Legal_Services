import { readFile } from "node:fs/promises";
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
 * with its screenshots from `apps/api/docs-seed/`; later changes to it reach
 * an existing guide through `GUIDE_UPDATES`.
 */
export const docsRouter = Router();

const readers = [requireAuth, requireRole("OWNER", "ADMIN", "EDITOR")];
const editors = [requireAuth, requireRole("OWNER", "ADMIN")];

const SEED_DIR = new URL("../../docs-seed/", import.meta.url);

const pageSelect = { id: true, title: true, body: true, position: true, updatedAt: true, updatedByName: true } as const;

/**
 * Changes to the bundled guide made after it was first seeded, applied once
 * to a guide that already exists. A guide seeded later already has them.
 * `add` takes the chapter from `DEFAULT_DOC_PAGES` by its title.
 */
const GUIDE_UPDATES: {
  key: string;
  remove?: string[];
  add?: { title: string; after: string }[];
  /** A sentence changed in a chapter; skipped where the firm has already reworded it. */
  replace?: { title: string; from: string; to: string }[];
  /** Chapters replaced by their bundled text, unless someone at the firm has edited them. */
  rewrite?: string[];
}[] = [
  {
    key: "2026-10-step-by-step",
    remove: ["What it costs to run", "Behind the scenes, in plain terms", "Where things are kept in the project", "Current limits and next steps"],
    add: [{ title: "Step by step: jobs, articles, enquiries and more", after: "Cases and the court's own record" }],
  },
  {
    key: "2026-10-otp-precheck",
    replace: [
      {
        title: "Signing in",
        from: "and is taken to the Contact page.",
        to: "and is taken to the Contact page. A mobile number nobody has added is refused straight away, before any code is texted to it, on all three sign-in pages.",
      },
    ],
  },
  {
    key: "2026-10-document-folders",
    rewrite: [
      "The admin console, section by section",
      "Cases and the court's own record",
      "Step by step: jobs, articles, enquiries and more",
      "Documents",
      "The lawyer workspace",
      "The client dashboard",
      "Glossary",
    ],
  },
  {
    key: "2026-10-folders-people",
    rewrite: [
      "Signing in",
      "The admin console, section by section",
      "Cases and the court's own record",
      "Step by step: jobs, articles, enquiries and more",
      "Documents",
      "The lawyer workspace",
      "The client dashboard",
      "Glossary",
    ],
  },
];

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const DOCIMG = /!\[([^\]]*)\]\(docimg:([a-z0-9-]+)\)/g;

/** The bundled screenshots these chapters use, stored once each: name → DocImage id. */
async function bundledImages(tx: Tx, bodies: string[]) {
  const names = new Set(bodies.flatMap((body) => [...body.matchAll(DOCIMG)].map((match) => match[2]!)));
  const ids = new Map<string, string>();
  const stored = await tx.docImage.findMany({ where: { name: { in: [...names] } }, select: { id: true, name: true } });
  for (const image of stored) if (!ids.has(image.name!)) ids.set(image.name!, image.id);
  for (const name of names) {
    if (ids.has(name)) continue;
    const data = await readFile(new URL(`${name}.png`, SEED_DIR)).catch(() => null);
    if (!data) continue;
    const image = await tx.docImage.create({
      data: { name, data: new Uint8Array(data), mimeType: "image/png", bytes: data.length },
      select: { id: true },
    });
    ids.set(name, image.id);
  }
  return ids;
}

/** A bundled chapter's Markdown with its screenshots pointing at their stored ids; one that is not bundled is dropped rather than left broken. */
function withImages(body: string, ids: Map<string, string>) {
  return body.replace(DOCIMG, (_, alt: string, name: string) => (ids.has(name) ? `![${alt}](docimg:${ids.get(name)})` : ""));
}

/**
 * Seeds the bundled guide the first time, never again (even if every chapter
 * is deleted later), and applies each of `GUIDE_UPDATES` once.
 */
async function syncGuide() {
  if ((await prisma.docGuideUpdate.count()) > GUIDE_UPDATES.length) return;
  await prisma.$transaction(
    async (tx) => {
      // Two console tabs opening at once must not both seed.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(724001)`;
      const done = new Set((await tx.docGuideUpdate.findMany({ select: { key: true } })).map((row) => row.key));

      if (!done.has("seeded")) {
        const fresh = !(await tx.docPage.count()) && !(await tx.docImage.count({ where: { name: { not: null } } }));
        if (fresh) {
          const ids = await bundledImages(tx, DEFAULT_DOC_PAGES.map((page) => page.body));
          await tx.docPage.createMany({
            data: DEFAULT_DOC_PAGES.map((page, index) => ({
              title: page.title,
              body: withImages(page.body, ids),
              position: index + 1,
              updatedByName: "ADOORA guide",
            })),
          });
          await tx.docGuideUpdate.createMany({ data: ["seeded", ...GUIDE_UPDATES.map((update) => update.key)].map((key) => ({ key })) });
          return;
        }
        // Seeded before updates were recorded.
        await tx.docGuideUpdate.create({ data: { key: "seeded" } });
      }

      for (const update of GUIDE_UPDATES) {
        if (done.has(update.key)) continue;
        if (update.remove?.length) await tx.docPage.deleteMany({ where: { title: { in: update.remove } } });
        for (const { title, after } of update.add ?? []) {
          const page = DEFAULT_DOC_PAGES.find((p) => p.title === title);
          if (!page || (await tx.docPage.count({ where: { title } }))) continue;
          const anchor = await tx.docPage.findFirst({ where: { title: after }, orderBy: { position: "asc" }, select: { position: true } });
          const last = await tx.docPage.aggregate({ _max: { position: true } });
          const position = anchor ? anchor.position + 1 : (last._max.position ?? 0) + 1;
          await tx.docPage.updateMany({ where: { position: { gte: position } }, data: { position: { increment: 1 } } });
          const ids = await bundledImages(tx, [page.body]);
          await tx.docPage.create({ data: { title, body: withImages(page.body, ids), position, updatedByName: "ADOORA guide" } });
        }
        for (const { title, from, to } of update.replace ?? []) {
          const page = await tx.docPage.findFirst({ where: { title }, select: { id: true, body: true } });
          if (page?.body.includes(from) && !page.body.includes(to)) {
            await tx.docPage.update({ where: { id: page.id }, data: { body: page.body.replace(from, to) } });
          }
        }
        for (const title of update.rewrite ?? []) {
          const page = DEFAULT_DOC_PAGES.find((p) => p.title === title);
          const stored = await tx.docPage.findFirst({ where: { title, updatedByName: "ADOORA guide" }, select: { id: true } });
          if (!page || !stored) continue;
          const ids = await bundledImages(tx, [page.body]);
          await tx.docPage.update({ where: { id: stored.id }, data: { body: withImages(page.body, ids) } });
        }
        await tx.docGuideUpdate.create({ data: { key: update.key } });
      }
    },
    { timeout: 30_000 },
  );
}

docsRouter.get("/docs", ...readers, async (req, res) => {
  await syncGuide();
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
