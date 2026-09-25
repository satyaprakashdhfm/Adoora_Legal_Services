"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { SessionUser } from "@/lib/portal/api";
import { homeFor, useSession } from "@/lib/portal/session";
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
      window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
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
        <ButtonLink href={homeFor(user)} className="mt-6">
          Go to your {homeFor(user) === "/admin" ? "admin console" : "dashboard"}
        </ButtonLink>
      </div>
    );
  }

  return <>{children(user)}</>;
}
