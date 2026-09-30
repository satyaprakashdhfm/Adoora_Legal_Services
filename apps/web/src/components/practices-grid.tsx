import Image from "next/image";
import Link from "next/link";
import type { PracticeArea } from "@/content/types";

/**
 * The home page's practice teaser — a 3 × 3 grid of photo cards, each with
 * the practice name in white serif and a gold arrow, over a
 * navy wash that keeps the copy legible whatever the photograph does.
 *
 * Two kinds of photograph, both resolved server-side by `publicImage()` and
 * passed in per slug:
 *
 * - `photo` — a full-bleed landscape frame (`practice-photo-<slug>` in
 *   `public/`). Preferred when present: the card is cropped `cover` behind
 *   the wash, and zooms slightly on hover.
 * - `thumb` — the small circular crop (`practice-<slug>`) that already
 *   exists for every practice. Too small to fill a card, so without a
 *   full-bleed frame the card falls back to the navy gradient with this
 *   inset as a gold-ringed disc on the right.
 *
 * Alternative Dispute Resolution is labelled by its full name rather than
 * `shortName` ("ADR") — the abbreviation reads as jargon on first visit.
 */

export type PracticeGridItem = {
  area: PracticeArea;
  photo: string | null;
  thumb: string | null;
};

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

function Card({ item }: { item: PracticeGridItem }) {
  const { area, photo, thumb } = item;
  const label = area.slug === "dispute-resolution" ? area.name : area.shortName;

  return (
    <Link
      href={`/services/${area.slug}`}
      className="group relative isolate flex h-full min-h-[8.5rem] flex-col justify-between overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))] p-4 shadow-sm shadow-ink/10 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/20 sm:min-h-[11.5rem] sm:p-6"
    >
      {photo ? (
        <>
          <Image
            src={photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="-z-20 object-cover transition duration-700 ease-out group-hover:scale-105"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,color-mix(in_oklab,var(--color-ink-deep)_88%,transparent)_0%,color-mix(in_oklab,var(--color-ink-deep)_55%,transparent)_50%,color-mix(in_oklab,var(--color-ink-deep)_12%,transparent)_100%)] transition duration-500 group-hover:opacity-90"
          />
        </>
      ) : (
        thumb && (
          <span
            aria-hidden="true"
            className="absolute -right-5 top-1/2 -z-10 h-28 w-28 -translate-y-1/2 overflow-hidden rounded-full ring-1 ring-gold-bright/60 transition duration-700 ease-out group-hover:scale-105 sm:-right-4 sm:h-40 sm:w-40"
          >
            <Image
              src={thumb}
              alt=""
              fill
              sizes="(min-width: 640px) 160px, 112px"
              className="scale-[1.12] object-cover opacity-85 transition duration-500 group-hover:opacity-100"
            />
          </span>
        )
      )}

      <div className="max-w-[75%]">
        <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight text-white text-balance [text-shadow:0_1px_12px_rgb(0_0_0/0.6)] sm:text-2xl">
          {label}
        </h3>
        <span
          aria-hidden="true"
          className="mt-2.5 block h-px w-6 bg-gold-bright/70 transition-all duration-500 group-hover:w-12"
        />
      </div>

      <span
        aria-hidden="true"
        className="mt-4 flex h-8 w-8 items-center justify-center rounded-full border border-gold-bright/70 text-gold-bright transition duration-300 group-hover:border-gold-bright group-hover:bg-gold-bright group-hover:text-ink-deep"
      >
        <ArrowIcon className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function PracticesGrid({ items }: { items: readonly PracticeGridItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={item.area.slug}
          /* Nine cards on a two-column grid leave the last one alone — let
             it take the full row there. */
          className={
            index === items.length - 1 && items.length % 2 === 1
              ? "sm:max-lg:col-span-2"
              : ""
          }
        >
          <Card item={item} />
        </li>
      ))}
    </ul>
  );
}
