import Link from "next/link";
import { practiceAreas } from "@/content/practice-areas";
import { PracticeIcon } from "@/components/practice-icon";

/**
 * The practices index — one row per practice area, opening on the case types
 * inside it.
 *
 * Built on native `<details>` rather than React state: it works before
 * hydration, needs no client bundle, and — the reason that matters here — the
 * case types stay in the HTML whether the row is open or shut, so a visitor
 * searching for "insolvency" or "RERA" still finds this page. A JavaScript
 * accordion that mounts its contents on open would take those words off it.
 *
 * Industry pages still exist and are reached from each practice page and the
 * footer — they simply no longer compete for a top-level slot.
 */

/** Flagship practices first, then the rest in their declared order. */
const displayOrder = [
  "corporate-ma",
  "banking-finance",
  "dispute-resolution",
  "real-estate-infrastructure",
  "taxation",
  "labour-employment",
  "intellectual-property",
  "regulatory-environmental",
];

const ordered = [...practiceAreas].sort(
  (a, b) => displayOrder.indexOf(a.slug) - displayOrder.indexOf(b.slug),
);

function Chevron() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3">
      <path
        d="M2 4.5 6 8.5 10 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PracticesIndex() {
  return (
    <div className="border-t border-line">
      {ordered.map((area) => (
        <details key={area.slug} className="group border-b border-line">
          {/* `list-none` plus the webkit rule drops the native disclosure
              triangle; the chevron on the right replaces it. */}
          <summary className="flex cursor-pointer list-none items-start gap-4 py-5 transition hover:bg-paper-warm/60 [&::-webkit-details-marker]:hidden">
            <PracticeIcon
              slug={area.slug}
              className="mt-0.5 h-6 w-6 shrink-0 text-gold"
            />

            <div className="flex-1">
              <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-ink transition group-open:text-gold-deep">
                {area.name}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                {area.tagline}
              </p>
            </div>

            <span className="mt-1.5 shrink-0 text-slate transition-transform duration-200 group-open:rotate-180">
              <Chevron />
            </span>
          </summary>

          <div className="pb-6 pl-10 sm:pl-12">
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {area.services.map((service) => (
                <li key={service.title}>
                  <Link
                    href={`/services/${area.slug}#services`}
                    className="group/item flex gap-2.5 text-sm leading-snug text-ink-soft transition hover:text-gold-deep"
                    /* The dense label reads well in a list, but the full title
                       is what actually describes the work. */
                    title={service.title}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    />
                    <span className="underline decoration-transparent decoration-1 underline-offset-4 transition group-hover/item:decoration-gold/50">
                      {service.short ?? service.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href={`/services/${area.slug}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep transition hover:text-ink"
            >
              All {area.shortName} work
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
        </details>
      ))}
    </div>
  );
}
