import { createSign } from "node:crypto";
import { env } from "../env.js";

/**
 * Signing in to Google as the firm's service account, for Search Console
 * (integrations/search-console.ts). A JWT signed with the key is swapped for
 * an access token, cached until shortly before it expires: one signature
 * and one POST, so no Google library.
 *
 * GOOGLE_SERVICE_ACCOUNT_JSON may be the key file as downloaded, or the file
 * base64-encoded on one line (the safe way to paste it into Railway). Pasted
 * as one line of JSON, Railway can turn each `\n` inside private_key into a
 * real line break, which no longer parses; that is undone here.
 */

export type ServiceAccount = { client_email: string; private_key: string };

function readKey(): { key: ServiceAccount | null; problem: string | null } {
  const raw = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return { key: null, problem: "GOOGLE_SERVICE_ACCOUNT_JSON is not set on the API." };
  let parsed: { client_email?: unknown; private_key?: unknown } | null = null;
  const forms = [raw, raw.replace(/\r?\n/g, "\\n"), Buffer.from(raw, "base64").toString("utf8")];
  for (const text of forms) {
    try {
      parsed = JSON.parse(text);
      break;
    } catch {
      // Try the next form.
    }
  }
  if (!parsed || typeof parsed !== "object") {
    return {
      key: null,
      problem:
        raw.length < 100
          ? `GOOGLE_SERVICE_ACCOUNT_JSON was cut off (only ${raw.length} characters arrived). Paste the key as one line of base64.`
          : "GOOGLE_SERVICE_ACCOUNT_JSON could not be read. Paste the key file base64-encoded on one line.",
    };
  }
  if (typeof parsed.client_email !== "string" || typeof parsed.private_key !== "string") {
    return { key: null, problem: "GOOGLE_SERVICE_ACCOUNT_JSON is not a service account key (no client_email or private_key)." };
  }
  return { key: { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") }, problem: null };
}

const { key: KEY, problem: KEY_PROBLEM } = readKey();

/** The service account, or null when the key is missing or unreadable. */
export const serviceAccount = () => KEY;
/** Why the key cannot be used, as a sentence for the console, or null when it can. */
export const serviceAccountProblem = () => KEY_PROBLEM;

const tokens = new Map<string, { token: string; expiresAt: number }>();

export async function googleAccessToken(scope: string): Promise<string> {
  const hit = tokens.get(scope);
  if (hit && Date.now() < hit.expiresAt - 60_000) return hit.token;
  if (!KEY) throw new Error(KEY_PROBLEM ?? "The Google service account is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned = `${part({ alg: "RS256", typ: "JWT" })}.${part({
    iss: KEY.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(KEY.private_key, "base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google sign-in failed: ${body.error_description ?? body.error ?? response.status}`);
  }
  tokens.set(scope, { token: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000 });
  return body.access_token;
}
