"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand";
import { primaryNav } from "@/lib/nav";
import { firm } from "@/content/firm";

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
      <div className="hidden border-b border-line bg-paper-warm lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2 text-xs text-slate">
          <p>{firm.regions}</p>
          <div className="flex items-center gap-5">
            <a href={firm.phoneHref} className="transition hover:text-gold">
              {firm.phone}
            </a>
            <a href={firm.emailHref} className="transition hover:text-gold">
              {firm.email}
            </a>
          </div>
        </div>
      </div>

      <nav
        ref={navRef}
        aria-label="Primary"
        className="mx-auto max-w-7xl px-6"
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
                          ? "text-gold"
                          : "text-ink-soft hover:text-gold"
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
                        active ? "text-gold" : "text-ink-soft hover:text-gold"
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
                                className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-paper-warm hover:text-gold ${
                                  index === 0
                                    ? "font-semibold text-gold"
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
              className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-mid lg:inline-block"
            >
              Request information
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
                                className="block py-2 pl-3 text-sm text-slate transition hover:text-gold"
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
                      className="block py-3.5 text-[0.95rem] font-medium text-ink transition hover:text-gold"
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
              className="block rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white"
            >
              Request information
            </Link>
            <div className="mt-4 flex flex-col gap-1 text-sm text-slate">
              <a href={firm.phoneHref}>{firm.phone}</a>
              <a href={firm.emailHref}>{firm.email}</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
