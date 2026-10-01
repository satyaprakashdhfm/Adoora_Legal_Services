"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireSession } from "@/components/portal/guard";
import { PhonePrompt } from "@/components/portal/client-sign-in";
import { Avatar } from "@/components/portal/ui";
import { signOut } from "@/lib/portal/session";

/**
 * The client dashboard (/dashboard) and the lawyer workspace (/lawyer): the
 * same pages, each area open only to its own accounts. It sits under the
 * site header, so a client never feels they have left the firm's website.
 */
export function DashboardShell({ area, children }: { area: "client" | "lawyer"; children: ReactNode }) {
  const pathname = usePathname();
  const base = area === "lawyer" ? "/lawyer" : "/dashboard";

  // The lawyer area's sign-in page sits outside it.
  if (pathname === "/lawyer/login") return <>{children}</>;

  return (
    <RequireSession
      allow={(user) => (area === "client" ? user.kind === "client" : user.kind === "staff" && user.role === "LAWYER")}
      deniedMessage={
        area === "client"
          ? "The client dashboard is for client accounts. Your firm account works in its own area."
          : "The lawyer workspace is for the firm's lawyers."
      }
    >
      {(user) => {
        const tabs = [
          { href: base, label: "Overview", short: "Overview", exact: true },
          { href: `${base}/cases`, label: "My cases", short: "Cases" },
          { href: `${base}/documents`, label: "Documents", short: "Documents" },
          { href: `${base}/queries`, label: user.kind === "client" ? "My queries" : "Client queries", short: "Queries" },
        ];

        return (
          <div className="min-h-[70vh] bg-paper-warm">
            {/* A client who signed in with Google has no verified mobile yet. */}
            {user.kind === "client" && !user.phone && <PhonePrompt />}
            <div className="border-b border-line bg-white">
              <div className="container-page flex items-center justify-between gap-4 pt-5 sm:pt-6">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={user.name} src={user.avatarUrl} size={40} />
                  <div className="min-w-0">
                    <p className="portal-label text-xs font-semibold uppercase tracking-wide text-slate">
                      {user.kind === "client" ? "Client dashboard" : "Lawyer workspace"}
                    </p>
                    <p className="truncate font-serif text-lg font-semibold text-ink">{user.name}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-sm">
                  <button type="button" onClick={() => void signOut()} className="text-slate hover:text-ink">
                    Sign out
                  </button>
                </div>
              </div>

              {/* Four equal tabs on phones, with shorter labels so all of them fit. */}
              <nav aria-label="Dashboard" className="container-page mt-4 grid grid-cols-4 sm:flex sm:gap-1">
                {tabs.map((tab) => {
                  const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={`whitespace-nowrap border-b-2 px-1 pb-3 text-center text-[0.8125rem] font-semibold transition sm:px-3 sm:text-sm ${
                        active ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
                      }`}
                    >
                      <span className="sm:hidden">{tab.short}</span>
                      <span className="max-sm:hidden">{tab.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="container-page py-6 sm:py-8">{children}</div>
          </div>
        );
      }}
    </RequireSession>
  );
}
