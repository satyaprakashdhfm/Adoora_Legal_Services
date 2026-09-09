import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env, isProduction } from "./env.js";

/**
 * Prisma 7 takes the connection through a driver adapter rather than reading
 * the URL from schema.prisma. The pg adapter owns the pool, so pool sizing is
 * configured here.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  // Railway's Postgres accepts a modest pool; the API is not connection-heavy.
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

export const prisma = new PrismaClient({
  adapter,
  log: isProduction ? ["error", "warn"] : ["error", "warn"],
});

/** Used by the readiness probe — a real query, not just a live socket. */
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
