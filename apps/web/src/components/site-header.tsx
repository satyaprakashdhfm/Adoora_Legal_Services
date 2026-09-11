"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand";
import { primaryNav } from "@/lib/nav";
import { firm } from "@/content/firm";

/** 14×14 stroke icons for the utility bar. */
function UtilityIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gold">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const icons = {
  pin: "M7 1.6c2 0 3.6 1.6 3.6 3.6 0 2.6-3.6 7.2-3.6 7.2S3.4 7.8 3.4 5.2C3.4 3.2 5 1.6 7 1.6zM7 6.6a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8z",
  phone:
    "M2.6 2.2h2l.9 2.2-1.2.9a6.6 6.6 0 003.4 3.4l.9-1.2 2.2.9v2a.9.9 0 01-1 .9A9.3 9.3 0 011.7 3.2a.9.9 0 01.9-1z",
  mail: "M1.8 3.2h10.4v7.6H1.8zM1.8 3.6L7 7.4l5.2-3.8",
} as const;

export function SiteHeader() {
  const pathname = usePathname();
  /** Label of the open desktop mega-menu, or null. */
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close everything on navigation.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes the mega-menu; a click outside the nav does too.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  // Lock body scroll behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      {/* Utility bar — contact details, not a call to action. */}
      <div className="hidden border-b border-line-strong bg-paper-tint lg:block">
        <div className="container-page flex items-center justify-between gap-6 py-2.5 text-xs text-ink-soft">
          <p className="flex items-center gap-1.5">
            <UtilityIcon path={icons.pin} />
            {firm.cities}
          </p>
          <div className="flex items-center gap-6">
            <a
              href={firm.phoneHref}
              className="flex items-center gap-1.5 transition hover:text-gold-deep"
            >
              <UtilityIcon path={icons.phone} />
              {firm.phone}
            </a>
            <a
              href={firm.emailHref}
              className="flex items-center gap-1.5 transition hover:text-gold-deep"
            >
              <UtilityIcon path={icons.mail} />
              {firm.email}
            </a>
          </div>
        </div>
      </div>

      <nav
        ref={navRef}
        aria-label="Primary"
        className="container-page"
        onMouseLeave={() => setOpenMenu(null)}
      >
        <div className="flex items-center justify-between gap-6 py-4">
          <Wordmark />

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-1 lg:flex">
            {primaryNav.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const active = isActive(item.href);
              const expanded = openMenu === item.label;

              return (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasChildren && setOpenMenu(item.label)}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-haspopup="true"
                      onClick={() => setOpenMenu(expanded ? null : item.label)}
                      className={`flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium transition ${
                        active || expanded
                          ? "text-gold-deep"
                          : "text-ink-soft hover:text-gold-deep"
                      }`}
                    >
                      {item.label}
                      <svg
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          d="M2 4.5 6 8.5 10 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`block rounded px-3 py-2 text-sm font-medium transition ${
                        active ? "text-gold-deep" : "text-ink-soft hover:text-gold-deep"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}

                  {hasChildren && expanded && (
                    <div className="fade-in absolute left-1/2 top-full z-50 w-[34rem] -translate-x-1/2 pt-3">
                      <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-xl shadow-ink/5">
                        <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 p-3">
                          {item.children?.map((child, index) => (
                            <li
                              key={child.href}
                              className={index === 0 ? "col-span-2" : undefined}
                            >
                              <Link
                                href={child.href}
                                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-paper-warm hover:text-gold-deep ${
                                  index === 0
                                    ? "font-semibold text-gold-deep"
                                    : "text-ink-soft"
                                }`}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden items-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright lg:inline-flex"
            >
              Request Consultation
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                <path
                  d="M2 8h11M9 4l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink lg:hidden"
            >
              <span className="sr-only">
                {mobileOpen ? "Close menu" : "Open menu"}
              </span>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
                {mobileOpen ? (
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6h14M3 10h14M3 14h14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="fade-in max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-line bg-paper lg:hidden"
        >
          <ul className="px-6 py-4">
            {primaryNav.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const expanded = mobileSection === item.label;

              return (
                <li key={item.label} className="border-b border-line last:border-0">
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() =>
                          setMobileSection(expanded ? null : item.label)
                        }
                        className="flex w-full items-center justify-between py-3.5 text-left text-[0.95rem] font-medium text-ink"
                      >
                        {item.label}
                        <svg
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                          className={`h-3 w-3 text-slate transition-transform ${
                            expanded ? "rotate-180" : ""
                          }`}
                        >
                          <path
                            d="M2 4.5 6 8.5 10 4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {expanded && (
                        <ul className="pb-3">
                          {item.children?.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className="block py-2 pl-3 text-sm text-slate transition hover:text-gold-deep"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block py-3.5 text-[0.95rem] font-medium text-ink transition hover:text-gold-deep"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line bg-paper-warm px-6 py-5">
            <Link
              href="/contact"
              className="block rounded-md bg-gold px-5 py-3 text-center text-sm font-semibold text-ink-deep"
            >
              Request Consultation
            </Link>
            <div className="mt-4 flex flex-col gap-1.5 text-sm text-slate">
              <a href={firm.phoneHref}>{firm.phone}</a>
              <a href={firm.emailHref}>{firm.email}</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
