import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { appUrl, env } from "../env.js";
import { HttpError } from "../lib/http.js";

/**
 * Google sign-in — OpenID Connect authorization-code flow with PKCE.
 *
 * The client secret never reaches the browser: the browser only carries the
 * one-time code back, and the API exchanges it server-to-server. The ID token
 * is then verified against Google's published signing keys, the audience,
 * the issuer and the nonce, so a token minted for another app is rejected.
 *
 * The redirect URI registered in Google Cloud Console must be exactly
 * `${APP_URL}/api/auth/google/callback`.
 */

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const googleRedirectUri = `${appUrl}/api/auth/google/callback`;

export type OAuthState = {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
  /** Epoch ms after which the attempt is void. */
  exp: number;
};

export function beginGoogleSignIn(next: string): { url: string; state: OAuthState } {
  const state: OAuthState = {
    state: randomBytes(16).toString("base64url"),
    nonce: randomBytes(16).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    next,
    exp: Date.now() + 10 * 60 * 1000,
  };

  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: state.state,
    nonce: state.nonce,
    code_challenge: createHash("sha256").update(state.verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  return { url: url.toString(), state };
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
};

export async function completeGoogleSignIn(
  code: string,
  saved: OAuthState,
): Promise<GoogleIdentity> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri,
      grant_type: "authorization_code",
      code_verifier: saved.verifier,
    }),
  });

  if (!response.ok) {
    throw new HttpError(401, "Google did not accept the sign-in. Please try again.", "google_exchange_failed");
  }

  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) {
    throw new HttpError(401, "Google returned no identity. Please try again.", "google_no_id_token");
  }

  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: env.GOOGLE_CLIENT_ID!,
  });

  if (payload.nonce !== saved.nonce) {
    throw new HttpError(401, "The sign-in could not be verified. Please try again.", "google_nonce_mismatch");
  }

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
  if (!email || payload.email_verified !== true) {
    throw new HttpError(403, "Your Google account's email address is not verified.", "google_email_unverified");
  }

  return {
    sub: String(payload.sub),
    email,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  };
}
