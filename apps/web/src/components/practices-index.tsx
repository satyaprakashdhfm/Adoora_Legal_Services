import Link from "next/link";
import { practiceAreas } from "@/content/practice-areas";

/**
 * The practices index — one row per practice, with the case types inside it.
 *
 * Laid out as an editorial index rather than four equal columns of bullets:
 * a numbered full-width row per practice, the name and its standing line on
 * the left, the case types set in three columns on the right. Same content,
 * but it gives the page a spine, uses the measure properly, and the practice
 * name is the thing that reads first rather than one heading among eight.
 *
 * Industry pages still exist and are reached from each practice page, the
 * sectors list and the footer — they simply no longer compete for a nav slot.
 */

/** Flagship practices first, then the rest in their declared order. */
const displayOrder = [
  "corporate-ma",
  "banking-finance",
  "dispute-resolution",
  "technology-media-telecom",
  "real-estate-infrastructure",
  "taxation",
  "labour-employment",
  "intellectual-property",
];

const ordered = [...practiceAreas].sort(
  (a, b) => displayOrder.indexOf(a.slug) - displayOrder.indexOf(b.slug),
);

export function PracticesIndex() {
  return (
    <ol className="divide-y divide-line border-t border-line-strong">
      {ordered.map((area, index) => (
        <li
          key={area.slug}
          className="group grid gap-x-10 gap-y-5 py-8 transition-colors lg:grid-cols-[2.5rem_17rem_1fr] lg:py-9"
        >
          {/* Index number. Sets the rhythm down the left edge and gives the
              eye something to travel along. */}
          <span
            aria-hidden="true"
            className="hidden font-serif text-xl leading-none text-gold/40 tabular-nums transition-colors group-hover:text-gold lg:block lg:pt-1.5"
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          <div>
            <h3 className="font-serif text-xl leading-snug font-semibold tracking-tight text-ink">
              <Link
                href={`/services/${area.slug}`}
                className="inline-flex items-baseline gap-2 transition-colors hover:text-gold-deep"
              >
                {area.shortName}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 translate-y-[-0.1rem] text-gold opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
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
              </Link>
            </h3>

            <p className="mt-2.5 text-sm leading-relaxed text-slate">
              {area.tagline}
            </p>
          </div>

          {/* Case types. CSS multi-column rather than a grid: the items then
              read down each column instead of across, and they pack to the top
              instead of distributing over the row's full height — a grid
              stretches its rows to match the tagline beside it. */}
          <ul className="columns-1 gap-x-6 sm:columns-2 lg:columns-3">
            {area.services.map((service) => (
              <li key={service.title} className="mb-2 break-inside-avoid">
                <Link
                  href={`/services/${area.slug}#services`}
                  /* The dense label reads well in a list; the full title is
                     what actually describes the work. */
                  title={service.title}
                  className="group/item flex items-start gap-2.5 text-sm leading-snug text-ink-soft transition-colors hover:text-gold-deep"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[0.4rem] h-1 w-1 shrink-0 rotate-45 bg-gold/50 transition-colors group-hover/item:bg-gold"
                  />
                  {service.short ?? service.title}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
