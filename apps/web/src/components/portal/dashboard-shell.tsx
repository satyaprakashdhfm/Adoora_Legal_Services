"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { RequireSession } from "@/components/portal/guard";
import { Avatar } from "@/components/portal/ui";
import { isFirmAdmin, signOut } from "@/lib/portal/session";

/**
 * The client and lawyer dashboard. It sits under the site header, so a
 * client never feels they have left the firm's website.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireSession
      // Editors work on website content, not case files.
      allow={(user) => user.kind === "client" || user.role !== "EDITOR"}
      deniedMessage="Content editors do not have access to case files."
    >
      {(user) => {
        const tabs = [
          { href: "/dashboard", label: "Overview", exact: true },
          { href: "/dashboard/cases", label: "My cases" },
          { href: "/dashboard/documents", label: "Documents" },
          { href: "/dashboard/queries", label: user.kind === "client" ? "My queries" : "Client queries" },
        ];

        return (
          <div className="min-h-[70vh] bg-paper-warm">
            <div className="border-b border-line bg-white">
              <div className="container-page flex flex-wrap items-center justify-between gap-4 pt-6">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatarUrl} size={40} />
                  <div>
                    <p className="portal-label text-xs font-semibold uppercase tracking-wide text-slate">
                      {user.kind === "client" ? "Client dashboard" : "Case dashboard"}
                    </p>
                    <p className="font-serif text-lg font-semibold text-ink">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {isFirmAdmin(user) && (
                    <Link href="/admin" className="font-semibold text-gold-deep hover:underline">
                      Admin console →
                    </Link>
                  )}
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
