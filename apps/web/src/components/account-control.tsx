"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { homeFor, isFirmAdmin, signOut, useSession } from "@/lib/portal/session";
import { Avatar } from "@/components/portal/ui";
import { firstName as firstNameOf } from "@/lib/portal/format";

/** Head-and-shoulders outline, the conventional "account" mark. */
function ProfileIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path
        d="M10 9.5a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5zM3.75 17c.5-3.3 3.1-5.25 6.25-5.25S15.75 13.7 16.25 17"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The account control in the main navigation bar, at its right-hand end.
 *
 * Signed out it is a "Login" button that opens `/login`, where the Google
 * button lives. Signed in it becomes the account menu, with a link into the
 * right workspace: `/admin` for owners and admins, `/dashboard` for clients
 * and lawyers.
 *
 * Until the session is known it renders the signed-out button, which is the
 * right answer for nearly every visitor and avoids an empty gap.
 *
 * - `nav`     desktop, beside "Request Consultation"
 * - `compact` mobile, an icon beside the menu button
 * - `drawer`  inside the mobile menu
 */
export function AccountControl({ variant }: { variant: "nav" | "compact" | "drawer" }) {
  const user = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Come back to the page the visitor was on, unless that page is /login.
  const loginHref =
    pathname && pathname !== "/" && pathname !== "/login"
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  if (!user) {
    if (variant === "compact") {
      return (
        <Link
          href={loginHref}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-white transition hover:border-gold-bright hover:text-gold-bright lg:hidden"
        >
          <span className="sr-only">Login</span>
          <ProfileIcon className="h-5 w-5" />
        </Link>
      );
    }

    if (variant === "drawer") {
      return (
        <Link
          href={loginHref}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white"
        >
          <ProfileIcon />
          Login
        </Link>
      );
    }

    return (
      <Link
        href={loginHref}
        aria-label="Login"
        className="hidden items-center gap-2 rounded-md border border-white/25 px-3 py-2.5 text-sm font-semibold text-white transition hover:border-gold-bright hover:text-gold-bright lg:inline-flex xl:px-4"
      >
        <ProfileIcon className="h-[18px] w-[18px]" />
        {/* The bar is full at laptop widths; the label joins from xl up. */}
        <span className="hidden xl:inline">Login</span>
      </Link>
    );
  }

  const home = homeFor(user);
  const homeLabel = isFirmAdmin(user) ? "Admin console" : "My dashboard";

  if (variant === "drawer") {
    return (
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <div className="mt-1 flex gap-4 text-sm">
            <Link href={home} className="text-gold-bright">{homeLabel}</Link>
            <button type="button" onClick={() => void signOut()} className="text-white/70 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const compact = variant === "compact";

  return (
    <div ref={ref} className={`relative ${compact ? "lg:hidden" : "hidden lg:block"}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-md border border-white/25 text-white transition hover:border-gold-bright hover:text-gold-bright ${
          compact ? "h-10 w-10 justify-center rounded-lg border-white/20" : "py-1.5 pl-1.5 pr-1.5 text-sm font-semibold xl:pr-3"
        }`}
      >
        <Avatar name={user.name} src={user.avatarUrl} size={compact ? 26 : 28} />
        {compact ? (
          <span className="sr-only">Account menu</span>
        ) : (
          <>
            <span className="sr-only xl:not-sr-only xl:max-w-[8rem] xl:truncate">{firstNameOf(user.name)}</span>
            <svg viewBox="0 0 12 12" aria-hidden="true" className={`hidden h-2.5 w-2.5 transition-transform xl:block ${open ? "rotate-180" : ""}`}>
              <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="fade-in absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-ink-deep text-white shadow-xl shadow-black/40"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-white/60">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            href={home}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-gold-bright transition hover:bg-white/5"
          >
            {homeLabel}
          </Link>
          {isFirmAdmin(user) && (
            <Link
              role="menuitem"
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/5"
            >
              Case dashboard
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => void signOut()}
            className="block w-full border-t border-white/10 px-4 py-2.5 text-left text-sm text-white/80 transition hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
