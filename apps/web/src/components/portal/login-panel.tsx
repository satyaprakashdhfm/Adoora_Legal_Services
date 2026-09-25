"use client";

import Link from "next/link";
import { useState } from "react";
import { api, googleSignInUrl } from "@/lib/portal/api";
import { homeFor, useSession } from "@/lib/portal/session";
import { Button, ErrorNote, Field, GoogleMark, Input } from "@/components/portal/ui";

/** What went wrong, in words a client can act on. */
const ERRORS: Record<string, string> = {
  google_unavailable: "Google sign-in is not switched on yet. Please try again later, or contact the firm.",
  google_cancelled: "Sign-in was cancelled. You can try again whenever you are ready.",
  google_state: "That sign-in link had expired. Please try again.",
  google_failed: "We could not complete the sign-in with Google. Please try again.",
  google_exchange_failed: "Google did not accept the sign-in. Please try again.",
  google_nonce_mismatch: "The sign-in could not be verified. Please try again.",
  google_no_id_token: "Google did not return your identity. Please try again.",
  google_email_unverified: "Your Google account's email address is not verified with Google.",
  account_inactive: "This account has been deactivated. Please contact the firm if you think this is a mistake.",
  account_mismatch: "This email is already linked to a different Google account. Sign in with that account, or contact the firm.",
  signup_closed: "New client accounts are created by the firm. Please contact us and we will set one up for you.",
};

export function LoginPanel({ error, next }: { error: string | null; next: string }) {
  const user = useSession();
  const [staffOpen, setStaffOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const data = new FormData(event.currentTarget);
    try {
      const result = await api<{ redirect: string }>("/auth/password", {
        method: "POST",
        body: { email: data.get("email"), password: data.get("password"), next },
      });
      window.location.assign(result.redirect);
    } catch (cause) {
      setFormError((cause as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-10">
        <p className="eyebrow text-gold-deep">Client &amp; staff portal</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Clients can upload documents and follow their matters. Lawyers and staff reach their
          cases and the admin console from the same account.
        </p>

        {user ? (
          <div className="mt-8 rounded-lg border border-line bg-paper-warm p-5">
            <p className="text-sm text-ink">
              You are signed in as <strong>{user.name}</strong>.
            </p>
            <Link href={homeFor(user)} className="mt-3 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4">
              Continue to your {homeFor(user) === "/admin" ? "admin console" : "dashboard"}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-6">
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

            <p className="mt-4 text-xs leading-relaxed text-slate">
              Signing in does not by itself create a lawyer–client relationship. Documents you
              upload are encrypted and visible only to you and the lawyers assigned to your matter.
              See our{" "}
              <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
            </p>

            <div className="mt-8 border-t border-line pt-5">
              <button
                type="button"
                aria-expanded={staffOpen}
                onClick={() => setStaffOpen((open) => !open)}
                className="text-xs font-semibold uppercase tracking-wide text-slate transition hover:text-ink"
              >
                Firm staff — sign in with a password {staffOpen ? "▴" : "▾"}
              </button>

              {staffOpen && (
                <form onSubmit={onPasswordSubmit} className="mt-4 space-y-4">
                  <Field label="Email">
                    <Input name="email" type="email" required autoComplete="username" />
                  </Field>
                  <Field label="Password">
                    <Input name="password" type="password" required autoComplete="current-password" />
                  </Field>
                  <ErrorNote>{formError}</ErrorNote>
                  <Button type="submit" tone="secondary" disabled={submitting} className="w-full">
                    {submitting ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
