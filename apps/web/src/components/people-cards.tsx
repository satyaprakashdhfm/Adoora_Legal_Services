import Image from "next/image";
import Link from "next/link";
import type { Person } from "@/content/people";
import { publicImage } from "@/lib/public-image";

/**
 * The home page's "Our people" band — full-bleed portrait cards rather than
 * the name list `team-tabs.tsx` drew when the roster ran to two tabs. Now
 * that the band is three names, a photo each reads as a proper introduction
 * rather than a directory.
 *
 * No portraits have been supplied yet, so each card falls back to a
 * silhouette on a navy ground until `photo` is set on that person in
 * `people.ts` — same convention `person-card.tsx` uses on the About page.
 */
export function PeopleCards({ people }: { people: readonly Person[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-3">
      {people.map((person) => {
        const photo = person.photo ? publicImage(person.photo) : null;

        return (
          <li key={person.slug}>
            <Link
              href={`/about#${person.slug}`}
              className="group relative block h-80 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 ease-out hover:z-10 hover:-translate-y-2 hover:scale-[1.04] hover:shadow-2xl hover:shadow-ink/25 sm:h-96"
            >
              <div className="absolute inset-0">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  /* Head and shoulders, cut off by the frame at the foot —
                     the same figure `person-card.tsx` draws, scaled up. */
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,var(--color-ink-mid),var(--color-ink))]">
                    <svg
                      viewBox="0 0 96 96"
                      aria-hidden="true"
                      className="h-28 w-28 text-white/15"
                      fill="currentColor"
                    >
                      <circle cx="48" cy="37" r="17" />
                      <path d="M14 96c0-22.6 15.2-38 34-38s34 15.4 34 38z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Held back to the lower half so a photograph still reads;
                  solid enough under the text to clear 4.5:1 on white. */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_65%,transparent)_42%,transparent_75%)]"
              />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <h3 className="font-serif text-lg font-semibold leading-snug text-white sm:text-xl">
                  {person.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-gold-bright">
                  {person.designation}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-white shadow-md transition-transform duration-300 group-hover:translate-x-0.5 sm:bottom-6 sm:right-6"
              >
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
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
