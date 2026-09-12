import Link from "next/link";
import { practiceAreas } from "@/content/practice-areas";

/**
 * The practices index — one block per practice area, listing the case types
 * inside it.
 *
 * This replaces the two card grids the home page used to carry (practice areas
 * and industry domains). A card gave one line of description and hid the work
 * itself; a visitor arrives looking for "insolvency" or "RERA", and this puts
 * those words on the page where they can be seen and indexed.
 *
 * Industry pages still exist and are reached from each practice page and the
 * footer — they simply no longer compete for a top-level slot.
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
  "regulatory-environmental",
];

const ordered = [...practiceAreas].sort(
  (a, b) => displayOrder.indexOf(a.slug) - displayOrder.indexOf(b.slug),
);

export function PracticesIndex() {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
      {ordered.map((area) => (
        <section key={area.slug}>
          <span aria-hidden="true" className="block h-0.5 w-8 bg-gold" />

          <h3 className="mt-4 font-serif text-lg leading-snug font-semibold tracking-tight text-ink">
            <Link
              href={`/services/${area.slug}`}
              className="transition hover:text-gold-deep"
            >
              {area.shortName}
            </Link>
          </h3>

          <ul className="mt-4 space-y-2.5">
            {area.services.map((service) => (
              <li key={service.title}>
                <Link
                  href={`/services/${area.slug}#services`}
                  className="group flex gap-2.5 text-sm leading-snug text-ink-soft transition hover:text-gold-deep"
                  /* The dense label reads well in a list, but the full title is
                     what actually describes the work. */
                  title={service.title}
                >
                  {/* Round bullet rather than the reference's corner tick.
                      Sized and nudged to sit on the first line's x-height for
                      the labels that wrap to two lines. */}
                  <span
                    aria-hidden="true"
                    className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  />
                  <span className="underline decoration-transparent decoration-1 underline-offset-4 transition group-hover:decoration-gold/50">
                    {service.short ?? service.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
