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
          { href: base, label: "Overview", exact: true },
          { href: `${base}/cases`, label: "My cases" },
          { href: `${base}/documents`, label: "Documents" },
          { href: `${base}/queries`, label: user.kind === "client" ? "My queries" : "Client queries" },
        ];

        return (
          <div className="min-h-[70vh] bg-paper-warm">
            {/* A client who signed in with Google has no verified mobile yet. */}
            {user.kind === "client" && !user.phone && <PhonePrompt />}
            <div className="border-b border-line bg-white">
              <div className="container-page flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatarUrl} size={40} />
                  <div>
                    <p className="portal-label text-xs font-semibold uppercase tracking-wide text-slate">
                      {user.kind === "client" ? "Client dashboard" : "Lawyer workspace"}
                    </p>
                    <p className="font-serif text-lg font-semibold text-ink">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <button type="button" onClick={() => void signOut()} className="text-slate hover:text-ink">
                    Sign out
                  </button>
                </div>
              </div>

              <nav aria-label="Dashboard" className="container-page mt-4 flex gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                  const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={`whitespace-nowrap border-b-2 px-3 pb-3 text-sm font-semibold transition ${
                        active ? "border-gold text-ink" : "border-transparent text-slate hover:text-ink"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="container-page py-8">{children}</div>
          </div>
        );
      }}
    </RequireSession>
  );
}
