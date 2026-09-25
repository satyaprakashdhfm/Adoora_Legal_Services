"use client";

import Link from "next/link";
import { googleSignInUrl } from "@/lib/portal/api";
import { homeFor, useSession } from "@/lib/portal/session";
import { ErrorNote, GoogleMark } from "@/components/portal/ui";

/** What went wrong, in words a client can act on. Shown only after a failed attempt. */
const ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in is not switched on yet. Please try again later.",
  google_cancelled: "Sign-in was cancelled. You can try again whenever you are ready.",
  google_state: "That sign-in link had expired. Please try again.",
  google_failed: "We could not complete the sign-in with Google. Please try again.",
  google_exchange_failed: "Google did not accept the sign-in. Please try again.",
  google_nonce_mismatch: "The sign-in could not be verified. Please try again.",
  google_no_id_token: "Google did not return your identity. Please try again.",
  google_email_unverified: "Your Google account's email address is not verified with Google.",
  account_inactive: "This account has been deactivated. Please contact the firm.",
  account_mismatch: "This email is linked to a different Google account. Sign in with that account, or contact the firm.",
  signup_closed: "New accounts are created by the firm. Please contact us and we will set one up for you.",
};

/**
 * The sign-in page: a heading and the Google button, nothing else.
 *
 * Staff password sign-in still exists on the API (`POST /api/auth/password`)
 * for emergencies, but is deliberately not offered here.
 */
export function LoginPanel({ error, next }: { error: string | null; next: string }) {
  const user = useSession();

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">Sign in</h1>

      {user ? (
        <Link
          href={homeFor(user)}
          className="mt-8 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4"
        >
          Continue to your {homeFor(user) === "/admin" ? "admin console" : "dashboard"}
        </Link>
      ) : (
        <>
          {error && (
            <div className="mt-6 text-left">
              <ErrorNote>{ERRORS[error] ?? "We could not sign you in. Please try again."}</ErrorNote>
            </div>
          )}
          <a
            href={googleSignInUrl(next)}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-[#dadce0] bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f8f9fa]"
          >
            <GoogleMark className="h-5 w-5" />
            Continue with Google
          </a>
        </>
      )}
    </div>
  );
}
