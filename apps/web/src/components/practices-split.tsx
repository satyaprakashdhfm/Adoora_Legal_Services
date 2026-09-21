"use client";

import Link from "next/link";
import { useState } from "react";
import type { PracticeArea } from "@/content/types";

/**
 * The home page's practice teaser — a numbered list on the left, the
 * selected practice's detail on the right. No photography on the detail
 * panel yet; it is copy only until the firm supplies frames per practice.
 *
 * Alternative Dispute Resolution is listed by its full name rather than
 * `shortName` ("ADR") — the list is short enough that the abbreviation saves
 * no room and reads as jargon on first visit.
 */
export function PracticesSplit({ items }: { items: readonly PracticeArea[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug ?? "");
  const active = items.find((item) => item.slug === activeSlug) ?? items[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:gap-12">
      <ul className="border-t border-line">
        {items.map((item, index) => {
          const isActive = item.slug === active?.slug;
          const label = item.slug === "dispute-resolution" ? item.name : item.shortName;

          return (
            <li key={item.slug} className="border-b border-line">
              <button
                type="button"
                onClick={() => setActiveSlug(item.slug)}
                aria-current={isActive}
                className={`flex w-full items-center justify-between gap-4 rounded-md border-l-2 px-4 py-4 text-left transition ${
                  isActive
                    ? "border-gold bg-paper-warm"
                    : "border-transparent hover:bg-paper-warm/60"
                }`}
              >
                <span className="flex items-baseline gap-3 min-w-0">
                  <span className="font-serif text-sm font-semibold text-gold-deep">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`truncate font-serif text-base font-semibold tracking-tight ${
                      isActive ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    {label}
                  </span>
                </span>
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 shrink-0 transition ${
                    isActive ? "text-gold-deep" : "text-slate-light"
                  }`}
                >
                  <path
                    d="M2 8h11M9 4l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      {active && (
        <div className="rounded-2xl border border-line bg-paper-warm p-10 sm:p-12">
          <span className="font-serif text-2xl font-semibold text-gold-deep">
            {String(items.indexOf(active) + 1).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="mt-4 block h-0.5 w-12 bg-gold" />
          <h3 className="mt-6 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {active.name}
          </h3>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
            {active.tagline}
          </p>
          <Link
            href={`/services/${active.slug}`}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep underline decoration-gold/40 underline-offset-[6px] transition hover:decoration-gold"
          >
            Explore more
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
        </div>
      )}
    </div>
  );
}
