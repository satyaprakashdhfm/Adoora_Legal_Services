import { createApp } from "./app.js";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { prisma } from "./db.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    "ADOORA API listening",
  );
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
