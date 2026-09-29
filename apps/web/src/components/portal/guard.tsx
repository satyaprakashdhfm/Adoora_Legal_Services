"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { SessionUser } from "@/lib/portal/api";
import { AREA_LABEL, LOGIN_PAGE, areaOf, areaOfPath, homeFor, switchTo, useSession } from "@/lib/portal/session";
import { ButtonLink, Spinner } from "@/components/portal/ui";

/**
 * Client-side gate for the signed-in areas.
 *
 * This is a convenience, not the security boundary: every piece of data on
 * these pages comes from the API, which enforces access on each request. The
 * gate only decides what to render while it finds out who is signed in.
 */
export function RequireSession({
  allow,
  deniedMessage,
  children,
}: {
  allow?: (user: SessionUser) => boolean;
  deniedMessage?: string;
  children: (user: SessionUser) => ReactNode;
}) {
  const user = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (user === null) {
      const page = LOGIN_PAGE[areaOfPath(pathname)];
      window.location.replace(`${page}?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, pathname]);

  if (!user) return <Spinner label={user === null ? "Redirecting to sign in" : "Loading"} />;

  if (allow && !allow(user)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="eyebrow text-gold-deep">Not available</p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-ink">This area is not part of your account</h1>
        <p className="mt-3 text-sm text-slate">
          {deniedMessage ?? "Your account does not have access to this page."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href={homeFor(user)}>Go to your {AREA_LABEL[areaOf(user)]}</ButtonLink>
          {/* The same person may have an account for this area too: sign out and sign in there. */}
          <button
            type="button"
            onClick={() => void switchTo(areaOfPath(pathname))}
            className="rounded-md border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:border-gold"
          >
            Sign in to the {AREA_LABEL[areaOfPath(pathname)]} instead
          </button>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
