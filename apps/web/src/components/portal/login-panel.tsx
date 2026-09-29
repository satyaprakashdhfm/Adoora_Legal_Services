"use client";

import Link from "next/link";
import { googleSignInUrl } from "@/lib/portal/api";
import { AREA_LABEL, type Area, areaOf, homeFor, switchTo, useSession } from "@/lib/portal/session";
import { ErrorNote, GoogleMark } from "@/components/portal/ui";
import { ClientSignIn, SIGN_IN_ERRORS } from "@/components/portal/client-sign-in";

/**
 * A sign-in page, one per area: clients at /login (the same form as the
 * header's sign-in popup: mobile OTP, then Google), lawyers at /lawyer/login
 * and the console at /admin/login (Google only). The API enforces the split:
 * each page opens only its own kind of account, so one email can have a
 * client account and a firm account without the two ever mixing.
 *
 * Staff password sign-in still exists on the API (`POST /api/auth/password`)
 * for emergencies, but is deliberately not offered here.
 */
const TITLES: Record<Area, { title: string; lead: string }> = {
  admin: { title: "Admin console", lead: "For the firm's owners and administrators." },
  lawyer: { title: "Lawyer sign in", lead: "Your assigned cases: court updates, documents and client queries." },
  client: { title: "Client sign in", lead: "Follow your cases, documents and queries." },
};

const OTHER_PAGES: { area: Area; href: string; label: string }[] = [
  { area: "client", href: "/login", label: "Client sign-in" },
  { area: "lawyer", href: "/lawyer/login", label: "Lawyer sign-in" },
  { area: "admin", href: "/admin/login", label: "Admin console" },
];

export function LoginPanel({ error, next, audience = "client" }: { error: string | null; next: string; audience?: Area }) {
  const user = useSession();
  const signedInHere = user && areaOf(user) === audience;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-10">
      <h1 className="text-center font-serif text-3xl font-semibold tracking-tight text-ink">{TITLES[audience].title}</h1>
      <p className="mt-2 text-center text-sm text-slate">{TITLES[audience].lead}</p>

      {user && signedInHere ? (
        <div className="text-center">
          <Link href={homeFor(user)} className="mt-8 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4">
            Continue to your {AREA_LABEL[audience]}
          </Link>
        </div>
      ) : user ? (
        /* Signed in to another area: the same person may have an account here
           too, so offer to sign out and sign in on this page. */
        <div className="mt-8 space-y-3 text-center text-sm">
          <p className="text-slate">
            You are signed in to the {AREA_LABEL[areaOf(user)]} as <span className="font-semibold text-ink">{user.email}</span>.
          </p>
          <button
            type="button"
            onClick={() => void switchTo(audience)}
            className="w-full rounded-md bg-ink px-4 py-2.5 font-semibold text-white hover:bg-ink-deep"
          >
            Sign out and sign in here
          </button>
          <Link href={homeFor(user)} className="inline-block font-semibold text-gold-deep underline underline-offset-4">
            Back to your {AREA_LABEL[areaOf(user)]}
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
              {(error === "not_staff" || error === "use_admin_login" || error === "use_lawyer_login") && (
                <Link
                  href={error === "not_staff" ? "/login" : error === "use_admin_login" ? "/admin/login" : "/lawyer/login"}
                  className="mt-2 inline-block text-sm font-semibold text-gold-deep underline underline-offset-4"
                >
                  {error === "not_staff" ? "Go to client sign-in" : error === "use_admin_login" ? "Go to the admin console sign-in" : "Go to lawyer sign-in"}
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
        </>
      )}

      <p className="mt-8 border-t border-line pt-4 text-center text-xs text-slate">
        {OTHER_PAGES.filter((page) => page.area !== audience).map((page, index) => (
          <span key={page.area}>
            {index > 0 && " · "}
            <Link href={page.href} className="font-semibold text-ink-soft hover:text-gold-deep">
              {page.label}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}
