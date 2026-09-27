"use client";

import Link from "next/link";
import { googleSignInUrl } from "@/lib/portal/api";
import { homeFor, useSession } from "@/lib/portal/session";
import { ErrorNote, GoogleMark } from "@/components/portal/ui";
import { ClientSignIn, SIGN_IN_ERRORS } from "@/components/portal/client-sign-in";

/**
 * A sign-in page. Clients use /login (the same form as the header's sign-in
 * popup: mobile OTP, then Google); the firm uses /admin/login (Google only).
 * The API enforces the split — a firm account is refused on the clients'
 * page and the other way round.
 *
 * Staff password sign-in still exists on the API (`POST /api/auth/password`)
 * for emergencies, but is deliberately not offered here.
 */
export function LoginPanel({ error, next, audience = "client" }: { error: string | null; next: string; audience?: "staff" | "client" }) {
  const user = useSession();

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-10">
      <h1 className="text-center font-serif text-3xl font-semibold tracking-tight text-ink">
        {audience === "staff" ? "Admin console" : "Client sign in"}
      </h1>
      <p className="mt-2 text-center text-sm text-slate">
        {audience === "staff" ? "For members of the firm." : "Follow your cases, documents and queries."}
      </p>

      {user ? (
        <div className="text-center">
          <Link
            href={homeFor(user)}
            className="mt-8 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4"
          >
            Continue to your {homeFor(user) === "/admin" ? "admin console" : "dashboard"}
          </Link>
        </div>
      ) : audience === "client" ? (
        <div className="mt-6">
          <ClientSignIn next={next} initialError={error} />
        </div>
      ) : (
        <>
          {error && (
            <div className="mt-6">
              <ErrorNote>{SIGN_IN_ERRORS[error] ?? "We could not sign you in. Please try again."}</ErrorNote>
              {error === "not_staff" && (
                <Link href="/login" className="mt-2 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4">
                  Go to client sign-in
                </Link>
              )}
            </div>
          )}
          <a
            href={googleSignInUrl(next, "staff")}
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
