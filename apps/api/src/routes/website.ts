import { Router, type RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * What the public website shows that the firm maintains from the console:
 * the lawyers it showcases, and its job openings.
 *
 *   websitePublicRouter   /api/public/...   read-only, no sign-in, cacheable
 *   websiteAdminRouter    /api/admin/...    OWNER / ADMIN
 */
export const websitePublicRouter = Router();
export const websiteAdminRouter = Router();

const adminOnly = [requireAuth, requireRole("OWNER", "ADMIN")];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/^adv\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** A unique slug, suffixing -2, -3… if the plain one is taken by another row. */
async function freeSlug(base: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  throw new HttpError(409, "Could not find a free web address for this entry.", "slug_taken");
}

const text = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value?.trim() ? value.trim() : null))
    .pipe(z.string().max(max).nullable().optional());

const lines = (maxItems: number, maxLength: number) =>
  z
    .array(z.string())
    .max(maxItems)
    .optional()
    .transform((items) => items?.map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(maxLength)).optional());

// ---------------------------------------------------------------------------
// Lawyer profiles
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  slug: text(80),
  name: z.string().trim().min(2, "Please enter the name.").max(160),
  designation: z.string().trim().min(2, "Please enter the designation.").max(160),
  group: z.enum(["LEGAL", "BUSINESS"]).default("LEGAL"),
  qualification: text(160),
  office: text(120),
  enrolment: text(80),
  stateBar: text(120),
  enrolledSince: z
    .union([z.coerce.number().int().min(1950).max(2100), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value)),
  experience: text(200),
  practices: lines(20, 80),
  education: lines(10, 300),
  bio: lines(12, 3000),
  memberships: lines(10, 300),
  email: z
    .union([z.string().trim().toLowerCase().email("Please enter a valid email."), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === "" ? null : value)),
  summary: text(1200),
  photo: text(120),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  userId: z.union([z.string().uuid(), z.literal(""), z.null()]).optional().transform((value) => (value === "" ? null : value)),
});

const profileSelect = {
  id: true,
  slug: true,
  name: true,
  designation: true,
  group: true,
  qualification: true,
  office: true,
  enrolment: true,
  stateBar: true,
  enrolledSince: true,
  experience: true,
  practices: true,
  education: true,
  bio: true,
  memberships: true,
  email: true,
  summary: true,
  photo: true,
  photoType: true,
  photoUpdatedAt: true,
  featured: true,
  published: true,
  sortOrder: true,
  userId: true,
  updatedAt: true,
} satisfies Prisma.LawyerProfileSelect;

type ProfileRow = Prisma.LawyerProfileGetPayload<{ select: typeof profileSelect }>;

function photoUrl(profile: ProfileRow): string | null {
  return profile.photoType && profile.photoUpdatedAt
    ? `/api/public/people/${profile.slug}/photo?v=${profile.photoUpdatedAt.getTime()}`
    : null;
}

function serialiseProfile(profile: ProfileRow) {
  const { photoType: _t, photoUpdatedAt: _u, ...rest } = profile;
  return { ...rest, photoUrl: photoUrl(profile) };
}

websitePublicRouter.get("/public/people", async (_req, res) => {
  const rows = await prisma.lawyerProfile.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: profileSelect,
  });
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({
    data: rows.map((row) => {
      const { userId: _user, published: _p, ...profile } = serialiseProfile(row);
      return profile;
    }),
  });
});

websitePublicRouter.get("/public/people/:slug/photo", async (req, res) => {
  const found = await prisma.lawyerProfile.findUnique({
    where: { slug: String(req.params.slug) },
    select: { photoData: true, photoType: true, published: true },
  });
  if (!found?.photoData || !found.photoType || !found.published) {
    throw new HttpError(404, "No photo.", "not_found");
  }
  res.set({
    "Content-Type": found.photoType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(Buffer.from(found.photoData));
});

websiteAdminRouter.get("/profiles", ...adminOnly, async (_req, res) => {
  const rows = await prisma.lawyerProfile.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { ...profileSelect, user: { select: { id: true, name: true, email: true, role: true } } },
  });
  res.set("Cache-Control", "no-store");
  res.json({ data: rows.map(({ user, ...row }) => ({ ...serialiseProfile(row), user })) });
});

async function assertLinkable(userId: string | null | undefined, profileId?: string) {
  if (!userId) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: { select: { id: true } } } });
  if (!user) throw new HttpError(400, "That account no longer exists.", "bad_user");
  if (user.profile && user.profile.id !== profileId) {
    throw new HttpError(409, `${user.name} already has a website profile.`, "profile_taken");
  }
}

websiteAdminRouter.post("/profiles", ...adminOnly, async (req, res) => {
  const input = profileSchema.parse(req.body);
  await assertLinkable(input.userId);
  const slug = await freeSlug(input.slug ?? input.name, async (s) =>
    Boolean(await prisma.lawyerProfile.findUnique({ where: { slug: s }, select: { id: true } })),
  );
  const created = await prisma.lawyerProfile.create({ data: { ...input, slug }, select: profileSelect });
  await audit(req, "profile.created", "LawyerProfile", created.id, { slug });
  res.status(201).json(serialiseProfile(created));
});

websiteAdminRouter.patch("/profiles/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const input = profileSchema.partial().parse(req.body);
  const current = await prisma.lawyerProfile.findUnique({ where: { id }, select: { id: true, slug: true } });
  if (!current) throw new HttpError(404, "Profile not found.", "not_found");
  await assertLinkable(input.userId, id);

  const slug =
    input.slug && slugify(input.slug) !== current.slug
      ? await freeSlug(input.slug, async (s) =>
          Boolean(await prisma.lawyerProfile.findFirst({ where: { slug: s, id: { not: id } }, select: { id: true } })),
        )
      : undefined;

  const updated = await prisma.lawyerProfile.update({ where: { id }, data: { ...input, slug }, select: profileSelect });
  await audit(req, "profile.updated", "LawyerProfile", id, { changes: Object.keys(input) });
  res.json(serialiseProfile(updated));
});

websiteAdminRouter.delete("/profiles/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const deleted = await prisma.lawyerProfile.delete({ where: { id }, select: { slug: true } }).catch(() => null);
  if (!deleted) throw new HttpError(404, "Profile not found.", "not_found");
  await audit(req, "profile.deleted", "LawyerProfile", id, { slug: deleted.slug });
  res.json({ ok: true });
});

/**
 * One-time carry-over of the roster the website shipped with (people.ts),
 * sent by the console. Refused once any profile exists, so it cannot
 * duplicate or overwrite what the firm has since edited.
 */
websiteAdminRouter.post("/profiles/import", ...adminOnly, async (req, res) => {
  const input = z.object({ profiles: z.array(profileSchema.extend({ slug: z.string().trim().min(1).max(80) })).max(100) }).parse(req.body);
  if (await prisma.lawyerProfile.count()) {
    throw new HttpError(409, "Profiles already exist, so the website roster has already been imported.", "already_imported");
  }
  await prisma.lawyerProfile.createMany({
    data: input.profiles.map((profile, index) => ({ ...profile, sortOrder: profile.sortOrder ?? index * 10 })),
    skipDuplicates: true,
  });
  await audit(req, "profile.imported", "LawyerProfile", null, { count: input.profiles.length });
  res.status(201).json({ imported: input.profiles.length });
});

const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } });
const photoMiddleware: RequestHandler = (req, res, next) => {
  photoUpload.single("photo")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      next(new HttpError(error.code === "LIMIT_FILE_SIZE" ? 413 : 400, error.code === "LIMIT_FILE_SIZE" ? "Portraits can be up to 2 MB." : "The photo could not be read.", "bad_photo"));
      return;
    }
    next(error as Error | undefined);
  });
};

/** JPEG, PNG or WebP, by their magic bytes rather than the file name. */
function imageType(buffer: Buffer): string | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

websiteAdminRouter.put("/profiles/:id/photo", ...adminOnly, photoMiddleware, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const file = req.file;
  if (!file) throw new HttpError(400, "Please choose a photo.", "no_file");
  const type = imageType(file.buffer);
  if (!type) throw new HttpError(415, "Please upload a JPEG, PNG or WebP image.", "bad_photo");

  const updated = await prisma.lawyerProfile
    .update({ where: { id }, data: { photoData: new Uint8Array(file.buffer), photoType: type, photoUpdatedAt: new Date() }, select: profileSelect })
    .catch(() => null);
  if (!updated) throw new HttpError(404, "Profile not found.", "not_found");
  await audit(req, "profile.photo", "LawyerProfile", id, { bytes: file.size });
  res.json(serialiseProfile(updated));
});

websiteAdminRouter.delete("/profiles/:id/photo", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const updated = await prisma.lawyerProfile
    .update({ where: { id }, data: { photoData: null, photoType: null, photoUpdatedAt: null, photo: null }, select: profileSelect })
    .catch(() => null);
  if (!updated) throw new HttpError(404, "Profile not found.", "not_found");
  res.json(serialiseProfile(updated));
});

// ---------------------------------------------------------------------------
// Job openings
// ---------------------------------------------------------------------------

const jobSchema = z.object({
  title: z.string().trim().min(3, "Please give the role a title.").max(160),
  slug: text(80),
  practiceArea: text(120),
  location: text(160),
  employmentType: z.string().trim().min(2).max(60).default("Full-time"),
  experience: text(160),
  summary: z.string().trim().min(20, "Please describe the role in a few sentences.").max(4000),
  responsibilities: lines(20, 400),
  requirements: lines(20, 400),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).default("DRAFT"),
  closesOn: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return undefined;
      if (!value) return null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid date." });
        return z.NEVER;
      }
      return new Date(`${value}T00:00:00.000Z`);
    }),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

const publicJobSelect = {
  slug: true,
  title: true,
  practiceArea: true,
  location: true,
  employmentType: true,
  experience: true,
  summary: true,
  responsibilities: true,
  requirements: true,
  closesOn: true,
  publishedAt: true,
} satisfies Prisma.JobOpeningSelect;

function openNow(): Prisma.JobOpeningWhereInput {
  const today = new Date(new Date().toISOString().slice(0, 10));
  return { status: "OPEN", OR: [{ closesOn: null }, { closesOn: { gte: today } }] };
}

websitePublicRouter.get("/public/jobs", async (_req, res) => {
  const jobs = await prisma.jobOpening.findMany({
    where: openNow(),
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    select: publicJobSelect,
  });
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ data: jobs });
});

websitePublicRouter.get("/public/jobs/:slug", async (req, res) => {
  const job = await prisma.jobOpening.findFirst({
    where: { slug: String(req.params.slug), ...openNow() },
    select: publicJobSelect,
  });
  if (!job) throw new HttpError(404, "This role is not open.", "not_found");
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json(job);
});

websiteAdminRouter.get("/jobs", ...adminOnly, async (_req, res) => {
  const jobs = await prisma.jobOpening.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
  const counts = await prisma.careerApplication.groupBy({ by: ["role"], _count: { _all: true } });
  const byTitle = new Map(counts.map((row) => [row.role, row._count._all]));
  res.set("Cache-Control", "no-store");
  res.json({ data: jobs.map((job) => ({ ...job, applications: byTitle.get(job.title) ?? 0 })) });
});

websiteAdminRouter.post("/jobs", ...adminOnly, async (req, res) => {
  const input = jobSchema.parse(req.body);
  const slug = await freeSlug(input.slug ?? input.title, async (s) =>
    Boolean(await prisma.jobOpening.findUnique({ where: { slug: s }, select: { id: true } })),
  );
  const created = await prisma.jobOpening.create({
    data: { ...input, slug, publishedAt: input.status === "OPEN" ? new Date() : null },
  });
  await audit(req, "job.created", "JobOpening", created.id, { slug, status: created.status });
  res.status(201).json(created);
});

websiteAdminRouter.patch("/jobs/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const input = jobSchema.partial().parse(req.body);
  const current = await prisma.jobOpening.findUnique({ where: { id } });
  if (!current) throw new HttpError(404, "Job opening not found.", "not_found");

  const slug =
    input.slug && slugify(input.slug) !== current.slug
      ? await freeSlug(input.slug, async (s) =>
          Boolean(await prisma.jobOpening.findFirst({ where: { slug: s, id: { not: id } }, select: { id: true } })),
        )
      : undefined;

  const updated = await prisma.jobOpening.update({
    where: { id },
    data: {
      ...input,
      slug,
      // First time it goes live is its posting date.
      publishedAt: input.status === "OPEN" && !current.publishedAt ? new Date() : undefined,
    },
  });
  await audit(req, "job.updated", "JobOpening", id, { changes: Object.keys(input), status: updated.status });
  res.json(updated);
});

websiteAdminRouter.delete("/jobs/:id", ...adminOnly, async (req, res) => {
  const id = z.string().uuid().parse(req.params.id);
  const deleted = await prisma.jobOpening.delete({ where: { id }, select: { slug: true } }).catch(() => null);
  if (!deleted) throw new HttpError(404, "Job opening not found.", "not_found");
  await audit(req, "job.deleted", "JobOpening", id, { slug: deleted.slug });
  res.json({ ok: true });
});
