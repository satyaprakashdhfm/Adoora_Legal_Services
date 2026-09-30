import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import type { Differentiator } from "@/content/firm";

/**
 * "Our approach" — a photograph down the left, the firm's five
 * differentiators as a mosaic of cards beside it: three across the top, two
 * across the bottom. Each card is numbered and carries a gold line icon, and
 * the grounds alternate warm / navy / mist so neighbouring cards never read
 * as one panel. The navy card is the second, so the eye lands on it first.
 *
 * Every card links to the fuller "Key strengths" band on /about.
 *
 * `photo` is resolved by the server-only `publicImage()` in the page; a
 * missing file leaves the navy gradient panel in its place.
 */

type Tone = "warm" | "navy" | "mist";

/* Ground per card, in display order — matches the approved mockup. */
const tones: Tone[] = ["warm", "navy", "mist", "mist", "warm"];

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
  { card: string; number: string; rule: string; icon: string; title: string; body: string; arrow: string }
> = {
  warm: {
    card: "bg-paper-warm border-line",
    number: "text-gold-deep",
    rule: "bg-gold/50",
    icon: "text-gold",
    title: "text-ink",
    body: "text-ink-soft",
    arrow: "border-ink/25 text-ink group-hover:border-gold group-hover:bg-gold group-hover:text-white",
  },
  navy: {
    card: "bg-ink-mid border-ink-mid",
    number: "text-gold-bright",
    rule: "bg-gold-bright/60",
    icon: "text-gold-bright",
    title: "text-white",
    body: "text-white/75",
    arrow: "border-white/40 text-white group-hover:border-gold-bright group-hover:bg-gold-bright group-hover:text-ink-deep",
  },
  mist: {
    card: "bg-mist border-mist-line",
    number: "text-gold-deep",
    rule: "bg-gold/50",
    icon: "text-gold",
    title: "text-ink",
    body: "text-ink-soft",
    arrow: "border-ink/25 text-ink group-hover:border-gold group-hover:bg-gold group-hover:text-white",
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

export function OurApproach({
  items,
  photo,
}: {
  items: readonly Differentiator[];
  photo: string | null;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))] sm:aspect-[2/1] lg:aspect-auto">
        {photo && (
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover object-[80%_55%]"
          />
        )}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          const tone = toneClasses[tones[index % tones.length]];
          /* Five cards on a two-column grid leave the last one alone — let it
             take the full row there instead of leaving a hole. */
          const isLastOdd = index === items.length - 1 && items.length % 2 === 1;

          return (
            <li
              key={item.title}
              className={`${spans[index] ?? "lg:col-span-2"} ${isLastOdd ? "sm:col-span-2" : ""}`}
            >
              <Link
                href="/about#approach"
                className={`group flex h-full flex-col sm:min-h-[14rem] rounded-2xl border p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/10 sm:p-7 lg:min-h-[15.5rem] ${tone.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`flex items-center gap-3 font-serif text-lg font-semibold ${tone.number}`}>
                    {String(index + 1).padStart(2, "0")}
                    <span aria-hidden="true" className={`h-px w-8 ${tone.rule}`} />
                  </span>
                  <Icon
                    aria-hidden="true"
                    className={`h-10 w-10 shrink-0 transition duration-300 group-hover:scale-110 ${tone.icon}`}
                  />
                </div>

                <h3 className={`mt-4 max-w-[16rem] font-serif text-xl font-semibold leading-snug tracking-tight text-balance ${tone.title}`}>
                  {item.title}
                </h3>
                <p className={`mt-3 max-w-sm text-[0.9rem] leading-relaxed ${tone.body}`}>
                  {item.body}
                </p>

                <span className="mt-auto pt-5 sm:pt-6">
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition duration-300 ${tone.arrow}`}
                  >
                    <ArrowIcon className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
