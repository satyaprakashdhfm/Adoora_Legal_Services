"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { googleSignInUrl } from "@/lib/portal/api";
import { homeFor, isFirmAdmin, signOut, useSession } from "@/lib/portal/session";
import { Avatar, GoogleMark } from "@/components/portal/ui";
import { firstName as firstNameOf } from "@/lib/portal/format";

/**
 * The sign-in control at the top right of every page.
 *
 * Signed out, it is Google's "Continue with Google" button — white, with the
 * multicolour G, as Google's branding rules ask. Signed in, it becomes the
 * account menu with a link into the right workspace: `/admin` for owners and
 * admins, `/dashboard` for clients and lawyers.
 *
 * Until the session is known it renders the signed-out button, which is the
 * right answer for nearly every visitor and avoids an empty gap.
 */
export function AccountControl({ variant }: { variant: "ribbon" | "compact" | "drawer" }) {
  const user = useSession();
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

  if (!user) {
    if (variant === "compact") {
      return (
        <a
          href={googleSignInUrl()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white lg:hidden"
        >
          <span className="sr-only">Continue with Google</span>
          <GoogleMark className="h-5 w-5" />
        </a>
      );
    }

    return (
      <a
        href={googleSignInUrl()}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-white font-semibold text-[#1f1f1f] shadow-sm ring-1 ring-black/5 transition hover:bg-[#f2f2f2] ${
          variant === "drawer" ? "w-full px-5 py-3 text-sm" : "px-3 py-1 text-xs"
        }`}
      >
        <GoogleMark className={variant === "drawer" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        Continue with Google
      </a>
    );
  }

  const home = homeFor(user);
  const homeLabel = isFirmAdmin(user) ? "Admin console" : "My dashboard";
  const firstName = firstNameOf(user.name);

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

  return (
    <div ref={ref} className={`relative ${variant === "compact" ? "lg:hidden" : ""}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-full transition hover:text-gold-bright ${
          variant === "compact" ? "h-10 w-10 justify-center rounded-lg border border-white/20" : "py-0.5 pl-0.5 pr-2 text-xs font-medium"
        }`}
      >
        <Avatar name={user.name} src={user.avatarUrl} size={variant === "compact" ? 26 : 22} />
        {variant === "ribbon" && (
          <>
            <span>{firstName}</span>
            <svg viewBox="0 0 12 12" aria-hidden="true" className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`}>
              <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
        {variant === "compact" && <span className="sr-only">Account menu</span>}
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
