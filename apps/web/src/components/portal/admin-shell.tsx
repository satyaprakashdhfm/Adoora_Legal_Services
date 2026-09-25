"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Wordmark } from "@/components/brand";
import { RequireSession } from "@/components/portal/guard";
import { Avatar } from "@/components/portal/ui";
import { isFirmAdmin, signOut } from "@/lib/portal/session";

const NAV = [
  { href: "/admin", label: "Overview", exact: true, icon: "M3 10.5 10 4l7 6.5V17H3z" },
  { href: "/admin/cases", label: "Cases", icon: "M4 5h12v11H4zM7 5V3.5h6V5M4 9h12" },
  { href: "/admin/documents", label: "Documents", icon: "M6 2.5h6l3.5 3.5v11.5H6zM12 2.5V6h3.5M8.5 10h5M8.5 13h5" },
  { href: "/admin/clients", label: "Clients", icon: "M10 9a3 3 0 100-6 3 3 0 000 6zM4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" },
  { href: "/admin/staff", label: "Lawyers & staff", icon: "M7 8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2.5 16c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5M13.5 8.5a2.2 2.2 0 100-4.4M14.5 11.6c1.8.4 3 1.9 3 4.4" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "M3 5h14v9H8l-4 3v-3H3z" },
  { href: "/admin/applications", label: "Applications", icon: "M5 3h10v14H5zM8 7h4M8 10h4M8 13h2" },
  { href: "/admin/audit", label: "Audit log", icon: "M10 3a7 7 0 110 14 7 7 0 010-14zM10 6.5V10l2.5 2" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The admin console at `/admin`: full screen, its own navigation, none of
 * the marketing site's chrome. Owners and admins only — lawyers work from
 * `/dashboard`, where they see the cases assigned to them.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  /* The mobile menu remembers the page it was opened on, so navigating
     anywhere closes it without an effect. */
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;

  return (
    <RequireSession
      allow={isFirmAdmin}
      deniedMessage="The admin console is for the firm's owners and administrators. Lawyers see their assigned cases on the dashboard."
    >
      {(user) => (
        <div className="min-h-dvh bg-paper-warm lg:grid lg:grid-cols-[15.5rem_1fr] lg:bg-ink">
          <aside
            className={`bg-ink text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col ${menuOpen ? "" : "max-lg:[&>nav]:hidden max-lg:[&>div.account]:hidden"}`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <Wordmark tone="dark" />
                <p className="eyebrow mt-3 text-gold-bright">Admin console</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenOn(menuOpen ? null : pathname)}
                aria-expanded={menuOpen}
                className="rounded-md border border-white/20 px-2.5 py-1.5 text-xs lg:hidden"
              >
                {menuOpen ? "Close" : "Menu"}
              </button>
            </div>

            <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
              <ul className="space-y-0.5">
                {NAV.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          active ? "bg-white/10 font-semibold text-gold-bright" : "text-white/75 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <NavIcon d={item.icon} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 border-t border-white/10 pt-4">
                <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white">
                  Case dashboard
                </Link>
                <Link href="/" className="block rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white">
                  View website
                </Link>
              </div>
            </nav>

            <div className="account flex items-center gap-3 border-t border-white/10 px-5 py-4">
              <Avatar name={user.name} src={user.avatarUrl} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-white/55">{user.role === "OWNER" ? "Owner" : "Administrator"}</p>
              </div>
              <button type="button" onClick={() => void signOut()} className="text-xs text-white/60 hover:text-white">
                Sign out
              </button>
            </div>
          </aside>

          <div className="min-w-0 bg-paper-warm px-4 py-6 sm:px-8 sm:py-8 lg:min-h-dvh">{children}</div>
        </div>
      )}
    </RequireSession>
  );
}
