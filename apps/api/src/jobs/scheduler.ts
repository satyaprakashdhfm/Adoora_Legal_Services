import { prisma } from "../db.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { discoverTrending } from "../pipeline/trending.js";
import { morningDrafts } from "../pipeline/draft.js";

/**
 * The background jobs, run inside the API process — no separate service to
 * pay for. A Postgres advisory lock makes sure only one copy runs a job even
 * if the API is ever scaled to more than one instance.
 *
 *   every 3 hours    read the legal-news feeds → trending leads
 *   06:30 IST daily  up to three article drafts from the best leads
 */

const THREE_HOURS = 3 * 60 * 60 * 1000;
const TICK = 10 * 60 * 1000;
const LOCKS = { trending: 7_310_001, drafts: 7_310_002 } as const;

export const jobState = {
  lastTrendingAt: null as Date | null,
  lastTrending: null as Awaited<ReturnType<typeof discoverTrending>> | null,
  lastDraftsAt: null as Date | null,
};

async function withLock<T>(key: number, run: () => Promise<T>): Promise<T | null> {
  const [row] = await prisma.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_lock(${key}) AS locked`;
  if (!row?.locked) return null;
  try {
    return await run();
  } finally {
    await prisma.$queryRaw`SELECT pg_advisory_unlock(${key})`;
  }
}

export async function runTrending() {
  const result = await withLock(LOCKS.trending, discoverTrending);
  if (result) {
    jobState.lastTrendingAt = new Date();
    jobState.lastTrending = result;
  }
  return result;
}

/** Past 06:30 in India today? */
function afterMorningIst() {
  const ist = new Date(Date.now() + 5.5 * 3_600_000);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes() >= 6 * 60 + 30;
}

async function tick() {
  try {
    if (!jobState.lastTrendingAt || Date.now() - jobState.lastTrendingAt.getTime() >= THREE_HOURS) await runTrending();
    // morningDrafts() counts today's automatic drafts itself, so running it on
    // every tick after 06:30 simply tops up to three and then does nothing.
    if (afterMorningIst()) {
      const result = await withLock(LOCKS.drafts, morningDrafts);
      if (result) jobState.lastDraftsAt = new Date();
    }
  } catch (error) {
    logger.error({ err: error }, "Scheduled job failed");
  }
}

export function startScheduler() {
  if (env.JOBS_ENABLED === "false" || env.NODE_ENV === "test") return;
  // First run two minutes after start, so a deploy is not slowed down.
  setTimeout(() => void tick(), 2 * 60 * 1000).unref();
  setInterval(() => void tick(), TICK).unref();
  logger.info("Background jobs scheduled (trending every 3h, drafts from 06:30 IST)");
}
