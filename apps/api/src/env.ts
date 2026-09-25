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

  /**
   * Public origin of the website. The browser reaches the API through the
   * website's `/api` rewrite, so this is the origin session cookies belong
   * to, the base of the Google redirect URI, and where sign-in lands.
   */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /** Google OAuth client. Google sign-in is switched off until both are set. */
  GOOGLE_CLIENT_ID: optionalString(z.string()),
  GOOGLE_CLIENT_SECRET: optionalString(z.string()),

  /**
   * Comma-separated emails that become OWNER staff accounts on their first
   * Google sign-in. Bootstraps the first administrator without a password.
   */
  ADMIN_EMAILS: z.string().default(""),

  /** Whether an unknown Google account may create a client account. */
  ALLOW_CLIENT_SIGNUP: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),

  /**
   * Where document bytes are kept. `s3` is any S3-compatible service —
   * Railway Buckets today; AWS S3, Cloudflare R2 or MinIO by changing the
   * S3_* values. `local` writes to disk and is for development only.
   */
  STORAGE_DRIVER: z.enum(["s3", "local"]).default("local"),
  S3_BUCKET: optionalString(z.string()),
  S3_ENDPOINT: optionalString(z.string().url()),
  S3_REGION: z.string().default("auto"),
  S3_ACCESS_KEY_ID: optionalString(z.string()),
  S3_SECRET_ACCESS_KEY: optionalString(z.string()),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  LOCAL_STORAGE_DIR: z.string().default("./storage"),

  /**
   * Master key for document encryption: 32 bytes, base64. Railway Buckets
   * have no server-side encryption, so documents are encrypted here before
   * they leave the process. Generate with: openssl rand -base64 32
   */
  DOCUMENT_ENCRYPTION_KEY: optionalString(z.string()),
  /** Label stored with each document, so the key can be rotated later. */
  DOCUMENT_ENCRYPTION_KEY_ID: z.string().default("k1"),

  MAX_UPLOAD_MB: z.coerce.number().int().min(1).max(100).default(25),
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

if (isProduction && !env.DOCUMENT_ENCRYPTION_KEY) {
  throw new Error(
    "DOCUMENT_ENCRYPTION_KEY must be set in production (32 bytes, base64). Generate one with: openssl rand -base64 32",
  );
}

if (isProduction && env.STORAGE_DRIVER !== "s3") {
  throw new Error(
    "STORAGE_DRIVER must be `s3` in production — local disk does not survive a redeploy.",
  );
}

if (
  env.STORAGE_DRIVER === "s3" &&
  !(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)
) {
  throw new Error(
    "STORAGE_DRIVER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY (and S3_ENDPOINT for anything but AWS).",
  );
}

/** Development-only fallback; production is guarded above. */
export const jwtSecret =
  env.JWT_SECRET ?? "development-only-secret-do-not-use-in-production";

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const appUrl = env.APP_URL.replace(/\/$/, "");

export const adminEmails = env.ADMIN_EMAILS.split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const googleEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);
