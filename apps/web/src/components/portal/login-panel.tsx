"use client";

import Link from "next/link";
import { AREA_LABEL, type Area, homeFor, useSession } from "@/lib/portal/session";
import { ClientSignIn } from "@/components/portal/client-sign-in";

/**
 * A sign-in page, one per area, each completely independent of the others:
 * signing in here never signs anyone out of another area.
 *
 *   /login          clients: any mobile number or Gmail; new ones sign up
 *   /lawyer/login   lawyers (and owners and admins, for their own cases):
 *                   a mobile number or Gmail registered on the Team page
 *   /admin/login    owners, admins and editors: the same, registered only
 *
 * The console's page is reached only by its address: the other two do not
 * link to it. Staff password sign-in still exists on the API
 * (`POST /api/auth/password`) for emergencies, but is not offered here.
 */
const TITLES: Record<Area, { title: string; lead: string }> = {
  admin: { title: "Admin console", lead: "For the firm's owners, administrators and editors." },
  lawyer: { title: "Lawyer sign in", lead: "Your assigned cases: court updates, documents and client queries." },
  client: { title: "Client sign in", lead: "Follow your cases, documents and queries." },
};

const OTHER_PAGE: Partial<Record<Area, { href: string; label: string }>> = {
  client: { href: "/lawyer/login", label: "Lawyer at ADOORA? Lawyer sign-in" },
  lawyer: { href: "/login", label: "Client sign-in" },
};

export function LoginPanel({ error, next, audience = "client" }: { error: string | null; next: string; audience?: Area }) {
  // The session of this page's own area: the others do not matter here.
  const user = useSession();
  const other = OTHER_PAGE[audience];

  return (
    <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 shadow-sm sm:p-10">
      <h1 className="text-center font-serif text-3xl font-semibold tracking-tight text-ink">{TITLES[audience].title}</h1>
      <p className="mt-2 text-center text-sm text-slate">{TITLES[audience].lead}</p>

      {user ? (
        <div className="mt-8 space-y-2 text-center text-sm">
          <p className="text-slate">
            Signed in as <span className="font-semibold text-ink">{user.email ?? user.name}</span>.
          </p>
          <Link href={homeFor(user)} className="inline-block font-semibold text-gold-deep underline underline-offset-4">
            Continue to your {AREA_LABEL[audience]}
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ClientSignIn next={next} initialError={error} audience={audience} />
        </div>
      )}

      {other && (
        <p className="mt-8 border-t border-line pt-4 text-center text-xs text-slate">
          <Link href={other.href} className="font-semibold text-ink-soft hover:text-gold-deep">
            {other.label}
          </Link>
        </p>
      )}
    </div>
  );
}
