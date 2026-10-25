import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { logger } from "../logger.js";

/**
 * One-off, for the go-live database: copies from the staging database only
 * what the live site starts with, and nothing else.
 *
 * - Ganesh Raghavendra: his firm account (owner) and his website profile.
 * - Every published article, with its images.
 * - Our Partners: A Dough Cookie (with the logo staging has) and Nectarray.
 *   The fictional partners the migrations insert are deleted first.
 *
 * Runs at start-up only while GO_LIVE_SOURCE_DATABASE_URL is set, and once
 * ever (recorded in the audit log). Remove the variable after it has run.
 */

const GANESH_EMAIL = "info@adooralegalservices.com";
const GANESH_SLUG = "ganesh-raghavendra";
const DONE = "go_live.copied";

export async function copyForGoLiveOnStartup() {
  const sourceUrl = env.GO_LIVE_SOURCE_DATABASE_URL;
  if (!sourceUrl) return;
  if (sourceUrl === env.DATABASE_URL) {
    logger.error("Go-live copy: the source is this service's own database; nothing copied");
    return;
  }

  const source = new PrismaClient({ adapter: new PrismaPg({ connectionString: sourceUrl, max: 2 }) });
  try {
    if (await prisma.auditLog.findFirst({ where: { action: DONE }, select: { id: true } })) return;

    // The fictional partners from the migrations, and the clients behind them.
    const partnerClients = (await prisma.partner.findMany({ select: { clientId: true } })).map((p) => p.clientId);
    await prisma.client.deleteMany({ where: { id: { in: partnerClients } } });

    // Ganesh: firm account, then his profile linked to it.
    const ganesh = await source.user.findUnique({ where: { email: GANESH_EMAIL } });
    if (ganesh) {
      await prisma.user.upsert({
        where: { email: GANESH_EMAIL },
        create: { ...ganesh, role: "OWNER", isActive: true, lastLoginAt: null },
        update: { role: "OWNER", isActive: true },
      });
    }
    const profile = await source.lawyerProfile.findUnique({ where: { slug: GANESH_SLUG } });
    if (profile) {
      await prisma.lawyerProfile.upsert({
        where: { slug: GANESH_SLUG },
        create: { ...profile, userId: ganesh?.id ?? null, featured: true, published: true, sortOrder: 0 },
        update: {},
      });
    }

    // Published articles, keeping their ids so the bodies' image ids still match.
    const articles = await source.article.findMany({ where: { status: "PUBLISHED" }, include: { images: true } });
    for (const { images, ...article } of articles) {
      if (await prisma.article.findUnique({ where: { slug: article.slug }, select: { id: true } })) continue;
      await prisma.article.create({
        data: {
          ...article,
          body: article.body ?? [],
          sourceMeta: article.sourceMeta ?? Prisma.DbNull,
          authorId: article.authorId && article.authorId === ganesh?.id ? article.authorId : null,
          images: { create: images.map(({ articleId: _articleId, ...image }) => image) },
        },
      });
    }

    // Our Partners: the firm's two.
    const cookie = await source.partner.findFirst({ where: { name: { contains: "dough", mode: "insensitive" } } });
    const partners = [
      { name: "Nectarray", website: "https://nectarray.com", logoData: null, logoType: null, logoUpdatedAt: null },
      {
        name: "A Dough Cookie",
        website: "https://adoughcookie.com",
        logoData: cookie?.logoData ?? null,
        logoType: cookie?.logoType ?? null,
        logoUpdatedAt: cookie?.logoUpdatedAt ?? null,
      },
    ];
    for (const [index, partner] of partners.entries()) {
      await prisma.client.create({
        data: {
          name: partner.name,
          kind: "ORGANISATION",
          organisation: partner.name,
          partner: { create: { ...partner, published: true, sortOrder: index * 10 } },
        },
      });
    }

    const summary = { owner: Boolean(ganesh), profile: Boolean(profile), articles: articles.length, partners: partners.length };
    await prisma.auditLog.create({ data: { action: DONE, entityType: "GoLive", metadata: summary } });
    logger.info(summary, "Go-live copy done; remove GO_LIVE_SOURCE_DATABASE_URL");
  } catch (error) {
    logger.error({ err: error }, "Go-live copy failed");
  } finally {
    await source.$disconnect();
  }
}
