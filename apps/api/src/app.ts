import express from "express";
import helmet from "helmet";
import cors from "cors";
// pino-http is CommonJS with an ESM-style declaration file; the named export
// is the one that resolves correctly under NodeNext.
import { pinoHttp } from "pino-http";
import rateLimit from "express-rate-limit";
import { corsOrigins, isProduction } from "./env.js";
import { logger } from "./logger.js";
import { healthRouter } from "./routes/health.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();

  /**
   * Railway terminates TLS at its edge and forwards one proxy hop. Without
   * this, req.ip is the proxy address and every caller shares a rate limit
   * bucket.
   */
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // The API serves JSON only; no need for a page-oriented CSP.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Server-to-server calls and curl send no Origin header.
        if (!origin) return callback(null, true);

        if (corsOrigins.includes(origin)) return callback(null, true);

        // Allow Railway and Vercel preview URLs so preview deploys work
        // without adding each generated hostname to the allowlist.
        if (
          /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(origin) ||
          /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)
        ) {
          return callback(null, true);
        }

        logger.warn({ origin }, "Blocked CORS origin");
        return callback(null, false);
      },
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 86_400,
    }),
  );

  app.use(express.json({ limit: "64kb" }));

  app.use(
    pinoHttp({
      logger,
      // Health checks are frequent and uninteresting.
      autoLogging: {
        ignore: (req: { url?: string }) =>
          req.url?.startsWith("/health") ?? false,
      },
    }),
  );

  /** Blanket ceiling. The form endpoints add their own tighter limits. */
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      skip: (req) => req.path.startsWith("/health"),
    }),
  );

  app.use(healthRouter);
  app.use("/api", publicRouter);
  app.use("/api/admin", adminRouter);

  app.get("/", (_req, res) => {
    res.json({
      service: "adoora-api",
      status: "ok",
      docs: "See docs/API.md in the repository.",
      environment: isProduction ? "production" : "development",
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
