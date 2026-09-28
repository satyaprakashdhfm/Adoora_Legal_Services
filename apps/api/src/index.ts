import { createApp } from "./app.js";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { prisma } from "./db.js";
import { startScheduler } from "./jobs/scheduler.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    "ADOORA API listening",
  );
  startScheduler();
  // TEMPORARY: prints the last page saved from the court's website, to fix its reader.
  if (process.env.PORTAL_DEBUG === "1") {
    void prisma.courtSnapshot
      .findFirst({ where: { requestId: "portal" }, orderBy: { fetchedAt: "desc" } })
      .then((row) => {
        const html = String((row?.payload as { html?: string } | null)?.html ?? "");
        for (let i = 0; i < html.length && i < 40_000; i += 3_000) console.log(`PORTAL_DEBUG ${i} ${html.slice(i, i + 3_000).replace(/\s+/g, " ")}`);
      });
  }
});

/**
 * Graceful shutdown. Railway sends SIGTERM and waits before killing the
 * container, so in-flight requests get a chance to finish and the Postgres
 * pool is closed rather than dropped.
 */
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down");

  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Do not hang forever if a connection refuses to close.
  setTimeout(() => {
    logger.warn("Forcing shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});
