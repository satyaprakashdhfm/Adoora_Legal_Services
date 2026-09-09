import { Router } from "express";
import { checkDatabase } from "../db.js";

export const healthRouter = Router();

/**
 * Liveness. Must not touch the database — Railway restarts the container if
 * this fails, and a database blip should not cycle a healthy API.
 */
healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "adoora-api",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/** Readiness. Checks the database, so it can legitimately return 503. */
healthRouter.get("/health/ready", async (_req, res) => {
  const database = await checkDatabase();

  res.status(database ? 200 : 503).json({
    status: database ? "ready" : "degraded",
    checks: { database },
    timestamp: new Date().toISOString(),
  });
});
