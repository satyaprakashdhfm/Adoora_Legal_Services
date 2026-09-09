import "dotenv/config";
import { z } from "zod";

/**
 * Environment validation. The process refuses to start on a bad config
 * rather than failing on the first request that needs the missing value.
 */
/**
 * Treat an empty string as "not set". A .env with `JWT_SECRET=""` or a blank
 * Railway variable means the value was not supplied, not that it is invalid.
 */
const optionalString = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    inner.optional(),
  );

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  /** Railway injects PORT. */
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /**
   * Comma-separated list of origins allowed to call the API. The web app's
   * public URL must be in here or the browser will block form submissions.
   */
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  /**
   * Signing secret for admin session tokens. Required in production; a
   * development fallback keeps local setup to one command.
   */
  JWT_SECRET: optionalString(z.string().min(32)),

  /** Where enquiry notifications are sent, once mail delivery is wired up. */
  NOTIFY_EMAIL: optionalString(z.string().email()),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

if (isProduction && !env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET must be set in production (32+ characters). Generate one with: openssl rand -base64 48",
  );
}

/** Development-only fallback; production is guarded above. */
export const jwtSecret =
  env.JWT_SECRET ?? "development-only-secret-do-not-use-in-production";

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
