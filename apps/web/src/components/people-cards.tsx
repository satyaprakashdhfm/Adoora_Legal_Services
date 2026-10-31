import Image from "next/image";
import type { Person, Spotlight } from "@/content/people";
import { publicImage } from "@/lib/public-image";
import { AutoSlider } from "@/components/auto-slider";

/**
 * The home page's "Our people" band: one person per slide on a paper-brown
 * card, with the Telangana High Court drawn faintly behind the text. Portrait
 * on the left inside a thin gold arc; on the right the name, designation and
 * a short introduction.
 * Slides advance on their own and pause under the cursor (`auto-slider.tsx`).
 *
 * The portrait falls back to a silhouette on navy until `photo` is set on the
 * person in `people.ts`, the same convention `person-card.tsx` uses on the
 * About page. The introduction comes from `spotlight`, and
 * is left out when it isn't set.
 */
export function PeopleCards({ people }: { people: readonly Person[] }) {
  return (
    <AutoSlider label="Our people">
      {people.map((person) => (
        <PersonSlide key={person.slug} person={person} />
      ))}
    </AutoSlider>
  );
}

function PersonSlide({ person }: { person: Person }) {
  const photo = person.photoUrl ?? (person.photo ? publicImage(person.photo) : null);

  return (
    <article className="relative isolate grid h-full items-center gap-6 overflow-hidden rounded-2xl border border-sand-line bg-[linear-gradient(100deg,var(--color-parchment)_0%,var(--color-parchment)_42%,var(--color-parchment-deep)_100%)] px-5 py-6 shadow-[0_18px_40px_-24px_rgb(110_72_40/0.45)] sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:gap-14 lg:px-14 lg:py-9">
      {/* The High Court, faint, low on the right behind the text. */}
      <Image
        src="/hc-telangana.png"
        alt=""
        width={434}
        height={260}
        className="pointer-events-none absolute -bottom-3 -right-6 -z-10 w-[85%] max-w-[40rem] select-none opacity-[0.11] md:w-[58%]"
      />

      {/* Portrait inside a thin gold arc, with a soft gold disc behind its top corner. */}
      <div className="relative mx-auto w-full max-w-[12rem] sm:max-w-[17rem] lg:max-w-[21rem]">
        <div aria-hidden="true" className="absolute -left-[18%] -top-[14%] aspect-square w-[78%] rounded-full bg-gold/10" />
        <div aria-hidden="true" className="absolute -left-[12%] -top-[9%] aspect-square w-[124%] rounded-full border border-gold/45" />
        <div className="relative aspect-[15/16] overflow-hidden rounded-xl shadow-[0_20px_40px_-18px_rgb(30_40_70/0.45)]">
          {photo ? (
            <Image
              src={photo}
              alt={`Portrait of ${person.name}`}
              fill
              sizes="(min-width: 1024px) 21rem, (min-width: 640px) 17rem, 12rem"
              quality={90}
              unoptimized={Boolean(person.photoUrl)}
              className="object-cover"
            />
          ) : (
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
      </div>

      <div className="text-center md:text-left">
        <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-[2.125rem]">
          {person.name}
        </h3>
        <p className="mt-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep sm:text-sm">
          {person.designation}
        </p>
        <span aria-hidden="true" className="mx-auto mt-4 block h-0.5 w-14 bg-gold md:mx-0" />

        {person.spotlight && <SpotlightBody spotlight={person.spotlight} />}
      </div>
    </article>
  );
}

function SpotlightBody({ spotlight }: { spotlight: Spotlight }) {
  return (
    <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft sm:text-base lg:text-[1.0625rem]">
      {spotlight.summary}
    </p>
  );
}
