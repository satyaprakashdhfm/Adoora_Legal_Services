import Image from "next/image";
import Link from "next/link";
import type { Person } from "@/content/people";
import { publicImage } from "@/lib/public-image";

/**
 * The home page's "Our people" band.
 *
 * From `sm` up, three portrait cards fan in an overlapping stack, the
 * centre card raised above its neighbours; narrow enough, and the stack
 * short enough, that the cluster sits centred with room either side rather
 * than stretching the full section width. Below `sm` there isn't room for
 * an overlap without cropping a card down to a sliver, so it falls back to
 * a plain vertical stack of the same cards, full width.
 *
 * A side card's caption sits partly behind the raised centre card, so its
 * text gets extra padding on the covered edge — enough that it wraps
 * clear of the overlap rather than being cut off under the card on top.
 *
 * No portraits have been supplied yet, so each card falls back to a
 * silhouette on a navy ground until `photo` is set on that person in
 * `people.ts` — same convention `person-card.tsx` uses on the About page.
 */

function PersonPhoto({ person }: { person: Person }) {
  const photo = person.photo ? publicImage(person.photo) : null;

  if (!photo) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,var(--color-ink-mid),var(--color-ink))]">
        {/* Head and shoulders, cut off by the frame at the foot. */}
        <svg
          viewBox="0 0 96 96"
          aria-hidden="true"
          className="h-24 w-24 text-white/15"
          fill="currentColor"
        >
          <circle cx="48" cy="37" r="17" />
          <path d="M14 96c0-22.6 15.2-38 34-38s34 15.4 34 38z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={photo}
      alt=""
      fill
      sizes="(min-width: 640px) 13rem, 90vw"
      className="object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

function Caption({
  person,
  paddingClassName = "p-4",
}: {
  person: Person;
  /** A full, non-shorthand padding — always paired with `p-*` would let the
   *  two fight over the same property depending on Tailwind's generated
   *  order, so each caller states every side (`pt-* pr-* pb-* pl-*`)
   *  explicitly instead of layering an override on top of a default. */
  paddingClassName?: string;
}) {
  return (
    <div className={`absolute inset-x-0 bottom-0 ${paddingClassName}`}>
      <h3 className="font-serif text-sm font-semibold leading-snug text-white sm:text-base">
        {person.name}
      </h3>
      <p className="mt-1 text-xs font-medium text-gold-bright sm:text-sm">
        {person.designation}
      </p>
    </div>
  );
}

export function PeopleCards({ people }: { people: readonly Person[] }) {
  const middle = Math.floor((people.length - 1) / 2);

  return (
    <>
      {/* From `sm`, an overlapping fan centred with room either side. */}
      <div className="mx-auto hidden max-w-xl px-8 pt-6 sm:block">
        <ul className="flex items-center justify-center">
          {people.map((person, index) => {
            const isRaised = index === middle;
            const coversLeftEdge = index > middle;
            const coversRightEdge = index < middle && index !== middle;

            return (
              <li
                key={person.slug}
                className={`relative ${index > 0 ? "-ml-10 sm:-ml-14" : ""} ${
                  isRaised ? "z-20" : "z-10"
                }`}
              >
                <Link
                  href={`/about#${person.slug}`}
                  className={`group relative block h-64 w-40 overflow-hidden rounded-2xl shadow-lg shadow-ink/10 transition-all duration-300 ease-out hover:z-30 hover:-translate-y-2 hover:scale-110 hover:shadow-2xl hover:shadow-ink/30 sm:h-72 sm:w-48 ${
                    isRaised ? "-translate-y-5" : ""
                  }`}
                >
                  <div className="absolute inset-0">
                    <PersonPhoto person={person} />
                  </div>

                  {/* Held back to the lower half so a photograph still
                      reads; solid enough under the text to clear 4.5:1 on
                      white. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_65%,transparent)_42%,transparent_75%)]"
                  />

                  <Caption
                    person={person}
                    paddingClassName={
                      coversRightEdge
                        ? "pt-4 pb-4 pl-4 pr-14 sm:pr-16"
                        : coversLeftEdge
                          ? "pt-4 pb-4 pr-4 pl-14 sm:pl-16"
                          : "p-4"
                    }
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Below `sm`, the same cards as a plain vertical stack. */}
      <ul className="grid gap-5 sm:hidden">
        {people.map((person) => (
          <li key={person.slug}>
            <Link
              href={`/about#${person.slug}`}
              className="group relative block h-72 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl"
            >
              <div className="absolute inset-0">
                <PersonPhoto person={person} />
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_65%,transparent)_42%,transparent_75%)]"
              />
              <Caption person={person} paddingClassName="p-5" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
