"use client";

import Image from "next/image";
import { useState, type SVGProps } from "react";
import type { Differentiator } from "@/content/firm";
import { publicImage } from "@/lib/public-image";

/**
 * "Our approach" — a numbered list of the firm's five differentiators on the
 * left, the selected one's full copy over a photograph on the right.
 *
 * One photograph (`approach.png` in `public/`) serves all five entries; only
 * the copy changes when a different one is selected. A light wash sits under
 * the text so it stays legible regardless of what part of that photograph
 * falls behind it.
 */

const icons: ((props: SVGProps<SVGSVGElement>) => React.JSX.Element)[] = [
  // Proven Legal Expertise — a single figure.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5 20.5c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" />
    </svg>
  ),
  // Client-First Approach — two figures.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8.5" cy="8" r="2.6" />
      <circle cx="15.5" cy="8" r="2.6" />
      <path d="M3 20c0-3.3 2.5-5.4 5.5-5.4S14 16.7 14 20" />
      <path d="M10 20c0-3.3 2.5-5.4 5.5-5.4S21 16.7 21 20" />
    </svg>
  ),
  // Connected Client Experience — a message bubble.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5.5h16a1 1 0 011 1v9a1 1 0 01-1 1H9.5L5 20.5V16.5H4a1 1 0 01-1-1v-9a1 1 0 011-1z" />
      <path d="M7.5 10.5h9M7.5 13.5h5.5" />
    </svg>
  ),
  // Cross-Border & Regulatory Mastery — a globe.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.8 2.3 4.3 5.3 4.3 8.5s-1.5 6.2-4.3 8.5c-2.8-2.3-4.3-5.3-4.3-8.5S9.2 5.8 12 3.5z" />
    </svg>
  ),
  // Strategic Legal Solutions — an ascending bar chart.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 20V12.5M10.5 20V9M16.5 20V5.5M3 20.5h18" />
    </svg>
  ),
];

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M2 8h11M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OurApproach({ items }: { items: readonly Differentiator[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex];
  const photo = publicImage("approach");

  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_1fr] lg:gap-10">
      <ul className="overflow-hidden rounded-2xl border border-line">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          const isActive = index === activeIndex;

          return (
            <li key={item.title} className={index > 0 ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-current={isActive}
                className={`flex w-full items-center gap-4 border-l-2 px-5 py-5 text-left transition ${
                  isActive
                    ? "border-gold bg-paper-warm"
                    : "border-transparent hover:bg-paper-warm/60"
                }`}
              >
                <Icon
                  className={`h-7 w-7 shrink-0 ${isActive ? "text-gold-deep" : "text-ink-soft"}`}
                />
                <span className="flex-1 font-serif text-base font-semibold leading-snug tracking-tight text-ink">
                  {item.title}
                </span>
                <ArrowIcon
                  className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-gold-deep" : "text-slate-light"}`}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative min-h-[22rem] overflow-hidden rounded-2xl border border-line lg:min-h-0">
        {photo && (
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
          />
        )}

        {/* A wash under the copy so it stays legible regardless of what
            part of the photograph falls behind it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(105deg,var(--color-paper)_0%,color-mix(in_oklab,var(--color-paper)_78%,transparent)_38%,transparent_65%)]"
        />

        <div className="relative flex h-full flex-col justify-center p-8 sm:p-12">
          <span aria-hidden="true" className="h-px w-9 bg-gold" />
          <h3 className="mt-6 max-w-sm font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
            {active.title}
          </h3>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-soft">
            {active.body}
          </p>
        </div>

        {/* Positioned clear of the corner cutout below rather than over it —
            its bite is confined to the outer 40px of the corner. White text:
            `approach.png` runs dark across its right side (bookshelf, desk). */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 right-16 hidden items-center gap-3 sm:flex"
        >
          <span className="h-10 w-px bg-gold-bright" />
          <span className="flex flex-col gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white">
            <span>People</span>
            <span>Perspective</span>
            <span>Progress</span>
          </span>
        </div>

        <div
          aria-hidden="true"
          className="absolute -bottom-10 -right-10 h-20 w-20 rounded-full bg-paper"
        />
      </div>
    </div>
  );
}
