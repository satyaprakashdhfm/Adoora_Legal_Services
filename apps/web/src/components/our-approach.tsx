"use client";

import Image from "next/image";
import { useEffect, useState, type SVGProps } from "react";
import type { Differentiator } from "@/content/firm";

/**
 * "Our approach" — a photograph down the left, the firm's five
 * differentiators as a mosaic of cards beside it: three across the top, two
 * across the bottom, on warm / navy / mist grounds.
 *
 * The navy ground travels. Every few seconds it moves on to the next card,
 * and the card it leaves takes over that card's old ground, so the two
 * swap colours rather than the whole set shifting. The photograph on the
 * left cross-fades to the picture for whichever card is navy, with that
 * card's number and title across its foot. Hovering a card moves the navy
 * there straight away; hovering anywhere in the band holds it still, and
 * readers who ask for reduced motion get no autoplay at all.
 *
 * Each photograph comes from `image`/`focus` on the entry in `firm.ts`.
 */

type Tone = "warm" | "navy" | "mist";

const INTERVAL = 3500;

/* Starting ground per card, in display order — the navy on the second. */
const initialTones: Tone[] = ["warm", "navy", "mist", "mist", "warm"];

/* lg column spans on the six-column card grid: three across, then two. */
const spans = [
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
];

const toneClasses: Record<
  Tone,
  { card: string; number: string; rule: string; icon: string; title: string; body: string }
> = {
  warm: {
    card: "bg-paper-warm border-line",
    number: "text-gold-deep",
    rule: "bg-gold/50",
    icon: "text-gold",
    title: "text-ink",
    body: "text-ink-soft",
  },
  navy: {
    card: "bg-navy-soft border-navy-soft shadow-xl shadow-ink/15",
    number: "text-gold-bright",
    rule: "bg-gold-bright/60",
    icon: "text-gold-bright",
    title: "text-white",
    body: "text-white/80",
  },
  mist: {
    card: "bg-mist border-mist-line",
    number: "text-gold-deep",
    rule: "bg-gold/50",
    icon: "text-gold",
    title: "text-ink",
    body: "text-ink-soft",
  },
};

const icons: ((props: SVGProps<SVGSVGElement>) => React.JSX.Element)[] = [
  // Proven Legal Expertise — scales of justice.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5v16M8 20.5h8M5 6.5h14M12 3.5a.9.9 0 100 .01" />
      <path d="M5 6.5L2.5 13h5L5 6.5zM19 6.5L16.5 13h5L19 6.5z" />
      <path d="M2.5 13a2.5 2.2 0 005 0M16.5 13a2.5 2.2 0 005 0" />
    </svg>
  ),
  // Client-First Approach — a group of three.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="7.5" r="3" />
      <circle cx="5.5" cy="9.5" r="2.3" />
      <circle cx="18.5" cy="9.5" r="2.3" />
      <path d="M6.5 20v-2.2c0-2.8 2.5-4.8 5.5-4.8s5.5 2 5.5 4.8V20H6.5z" />
      <path d="M4.6 14.6C2.7 14.9 1.5 16.3 1.5 18v2h3M19.4 14.6c1.9.3 3.1 1.7 3.1 3.4v2h-3" />
    </svg>
  ),
  // Connected Client Experience — a speech bubble.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5c5 0 9 3.3 9 7.5s-4 7.5-9 7.5c-1.1 0-2.2-.2-3.2-.5L4 20.5l1.3-4.2C3.9 14.9 3 13 3 11c0-4.2 4-7.5 9-7.5z" />
    </svg>
  ),
  // Cross-Border & Regulatory Mastery — a globe.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M4.2 7.5h15.6M4.2 16.5h15.6" />
      <path d="M12 3c2.6 2.4 4 5.5 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.5-4-9s1.4-6.6 4-9z" />
    </svg>
  ),
  // Strategic Legal Solutions — an ascending bar chart.
  (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 20.5h19" />
      <rect x="4" y="14" width="3.2" height="6.5" />
      <rect x="9" y="10.5" width="3.2" height="10" />
      <rect x="14" y="7" width="3.2" height="13.5" />
      <rect x="19" y="3.5" width="2.5" height="17" />
    </svg>
  ),
];

export function OurApproach({ items }: { items: readonly Differentiator[] }) {
  const [tones, setTones] = useState<Tone[]>(() =>
    items.map((_, i) => initialTones[i % initialTones.length]),
  );
  const active = Math.max(0, tones.indexOf("navy"));
  const [paused, setPaused] = useState(false);

  /* Move the navy ground to card `next`; the two cards swap grounds. */
  function moveTo(next: number) {
    setTones((current) => {
      const from = current.indexOf("navy");
      if (from === next || from < 0) return current;
      const swapped = [...current];
      swapped[from] = current[next];
      swapped[next] = "navy";
      return swapped;
    });
  }

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => moveTo((active + 1) % items.length), INTERVAL);
    return () => window.clearTimeout(id);
  }, [active, paused, items.length]);

  return (
    <div
      className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))] sm:aspect-[2/1] lg:aspect-auto">
        {items.map((item, index) => (
          <Image
            key={item.title}
            src={item.image}
            alt=""
            fill
            sizes="(min-width: 1280px) 440px, (min-width: 1024px) 34vw, 100vw"
            quality={90}
            style={{ objectPosition: item.focus }}
            className={`object-cover transition-[opacity,transform] duration-1000 ease-out ${
              index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ))}

        {/* The selected card's number and title across the foot. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--color-ink-deep)_85%,transparent),transparent)] px-6 pb-5 pt-16"
        >
          <p key={active} className="rise font-serif text-white">
            <span className="text-sm font-semibold text-gold-bright">
              {String(active + 1).padStart(2, "0")}
            </span>
            <span className="ml-3 text-lg font-semibold">{items[active]?.title}</span>
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          const tone = toneClasses[tones[index]];
          /* Five cards on a two-column grid leave the last one alone — let it
             take the full row there instead of leaving a hole. */
          const isLastOdd = index === items.length - 1 && items.length % 2 === 1;

          return (
            <li
              key={item.title}
              onMouseEnter={() => moveTo(index)}
              className={`${spans[index] ?? "lg:col-span-2"} ${isLastOdd ? "sm:col-span-2" : ""}`}
            >
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 transition-[background-color,border-color,box-shadow] duration-700 ease-out sm:p-7 lg:min-h-[13rem] ${tone.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`flex items-center gap-3 font-serif text-lg font-semibold transition-colors duration-700 ${tone.number}`}>
                    {String(index + 1).padStart(2, "0")}
                    <span aria-hidden="true" className={`h-px w-8 transition-colors duration-700 ${tone.rule}`} />
                  </span>
                  <Icon
                    aria-hidden="true"
                    className={`h-10 w-10 shrink-0 transition-colors duration-700 ${tone.icon}`}
                  />
                </div>

                <h3 className={`mt-4 max-w-[16rem] font-serif text-xl font-semibold leading-snug tracking-tight text-balance transition-colors duration-700 ${tone.title}`}>
                  {item.title}
                </h3>
                <p className={`mt-3 max-w-sm text-[0.9rem] leading-relaxed transition-colors duration-700 ${tone.body}`}>
                  {item.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
