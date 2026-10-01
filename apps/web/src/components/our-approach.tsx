import Image from "next/image";
import type { SVGProps } from "react";
import type { Differentiator } from "@/content/firm";

/**
 * "Our approach": the handshake photograph down the left, the firm's five
 * differentiators as a mosaic of cards beside it (three across the top, two
 * across the bottom). Static: no rotation, no hover hand-over. The cards
 * alternate two light grounds, mist blue and warm paper.
 */

/* The one photograph for the panel. */
const PHOTO = { src: "/approach-client-first1.jpg", focus: "45% 50%" };

/* lg column spans on the six-column card grid: three across, then two. */
const spans = [
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
];

/* Alternating grounds: blue, paper, blue, paper, blue. */
const grounds = ["bg-mist border-mist-line", "bg-paper-warm border-line"];

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
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
      {/* 3:2 on phones; on wide screens as tall as the cards beside it. */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-[linear-gradient(160deg,var(--color-navy-soft),var(--color-ink-deep))] shadow-sm shadow-ink/10 lg:aspect-auto">
        <Image
          src={PHOTO.src}
          alt=""
          fill
          sizes="(min-width: 1280px) 480px, (min-width: 1024px) 38vw, 100vw"
          quality={90}
          style={{ objectPosition: PHOTO.focus }}
          className="object-cover"
        />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          /* Five cards on a two-column grid leave the last one alone; let it
             take the full row there instead of leaving a hole. */
          const isLastOdd = index === items.length - 1 && items.length % 2 === 1;

          return (
            <li
              key={item.title}
              className={`${spans[index] ?? "lg:col-span-2"} ${isLastOdd ? "sm:col-span-2" : ""}`}
            >
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 sm:p-7 lg:min-h-[13rem] ${grounds[index % 2]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex items-center gap-3 font-serif text-lg font-semibold text-gold-deep">
                    {String(index + 1).padStart(2, "0")}
                    <span aria-hidden="true" className="h-px w-8 bg-gold/50" />
                  </span>
                  <Icon aria-hidden="true" className="h-10 w-10 shrink-0 text-gold" />
                </div>

                <h3 className="mt-4 max-w-[16rem] font-serif text-xl font-semibold leading-snug tracking-tight text-balance text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-sm text-[0.9rem] leading-relaxed text-ink-soft">
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
