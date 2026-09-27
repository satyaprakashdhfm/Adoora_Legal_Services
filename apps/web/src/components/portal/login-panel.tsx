"use client";

import Link from "next/link";
import { useState } from "react";
import { googleSignInUrl } from "@/lib/portal/api";
import { homeFor, useSession } from "@/lib/portal/session";
import { ErrorNote, GoogleMark } from "@/components/portal/ui";
import { OtpSignIn } from "@/components/portal/otp-sign-in";

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
  use_admin_login: "This is a firm account. Firm members sign in at the admin console, not here.",
  not_staff: "This Google account is not a member of the firm. Clients sign in on the client sign-in page.",
  otp_unavailable: "Mobile sign-in is not available right now. Please use Google, or try again later.",
  otp_invalid: "That code could not be verified. Please try again.",
  otp_failed: "We could not complete the mobile sign-in. Please try again.",
  phone_not_registered: "This mobile number is not on any client account. Sign in with Google, or ask the firm to add your number.",
  phone_ambiguous: "This mobile number is on more than one account. Please sign in with Google, or contact the firm.",
};

/**
 * A sign-in page: a heading and the Google button, nothing else. Clients use
 * /login; the firm uses /admin/login. The API enforces the split — a firm
 * account is refused on the clients' page and the other way round.
 *
 * Staff password sign-in still exists on the API (`POST /api/auth/password`)
 * for emergencies, but is deliberately not offered here.
 */
export function LoginPanel({ error, next, audience = "client" }: { error: string | null; next: string; audience?: "staff" | "client" }) {
  const user = useSession();
  /** An error from the mobile sign-in, which happens on this page rather than by redirect. */
  const [otpError, setOtpError] = useState<string | null>(null);
  const shownError = otpError ?? error;
  const otherPage = audience === "staff" ? "/login" : "/admin/login";

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-sm sm:p-10">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">
        {audience === "staff" ? "Admin console" : "Client sign in"}
      </h1>
      <p className="mt-2 text-sm text-slate">
        {audience === "staff" ? "For members of the firm." : "Follow your cases, documents and queries."}
      </p>

      {user ? (
        <Link
          href={homeFor(user)}
          className="mt-8 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4"
        >
          Continue to your {homeFor(user) === "/admin" ? "admin console" : "dashboard"}
        </Link>
      ) : (
        <>
          {shownError && (
            <div className="mt-6 text-left">
              <ErrorNote>{ERRORS[shownError] ?? "We could not sign you in. Please try again."}</ErrorNote>
              {(shownError === "use_admin_login" || shownError === "not_staff") && (
                <Link href={otherPage} className="mt-2 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4">
                  {shownError === "use_admin_login" ? "Go to the admin console sign-in" : "Go to client sign-in"}
                </Link>
              )}
            </div>
          )}
          <a
            href={googleSignInUrl(next, audience)}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-md border border-[#dadce0] bg-white px-5 py-3 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f8f9fa]"
          >
            <GoogleMark className="h-5 w-5" />
            Continue with Google
          </a>
          {audience === "client" && <OtpSignIn next={next} onError={setOtpError} />}
        </>
      )}
    </div>
  );
}
