import Image from "next/image";
import type { Person, Spotlight } from "@/content/people";
import { publicImage } from "@/lib/public-image";
import { AutoSlider } from "@/components/auto-slider";

/**
 * The home page's "Our people" band: one person per slide, portrait on the
 * left over soft beige blocks, and on the right the name, designation,
 * a short introduction and four credentials.
 * Slides advance on their own and pause under the cursor (`auto-slider.tsx`).
 *
 * The portrait falls back to a silhouette on navy until `photo` is set on the
 * person in `people.ts`, the same convention `person-card.tsx` uses on the
 * About page. The introduction and credentials come from `spotlight`, and
 * are left out when it isn't set.
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
    <article className="grid h-full items-center gap-6 rounded-2xl border border-sand-line bg-sand px-5 py-6 shadow-sm sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10 lg:gap-14 lg:px-14 lg:py-9">
      {/* Portrait, with soft beige blocks set off behind it — one low on the
          left, one high on the right, a short one under its foot. */}
      <div className="relative mx-auto w-full max-w-[12rem] sm:max-w-[17rem] lg:max-w-[21rem]">
        <div aria-hidden="true" className="absolute -left-5 bottom-[3%] top-[22%] w-2/5 rounded-md bg-gold/20 sm:-left-8" />
        <div aria-hidden="true" className="absolute -right-4 top-[4%] h-[82%] w-1/3 rounded-md bg-gold/20 sm:-right-6" />
        <div aria-hidden="true" className="absolute -bottom-3 right-[5%] h-6 w-1/4 rounded-md bg-gold/15" />
        <div className="relative aspect-[15/16] overflow-hidden rounded-md shadow-lg shadow-ink/15">
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
    <>
      <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft sm:text-base lg:text-[1.0625rem]">
        {spotlight.summary}
      </p>

      {/* Two by two: icon in a beige disc with its text beside it, stacked
          and centred on phones. */}
      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
        {spotlight.credentials.map((item) => (
          <li
            key={item.title}
            className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-3 md:text-left"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-paper/55">
              <CredentialIcon name={item.icon} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink sm:text-base">{item.title}</span>
              <span className="mt-0.5 block text-xs text-ink-soft sm:text-sm">{item.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function CredentialIcon({ name }: { name: Spotlight["credentials"][number]["icon"] }) {
  const paths = {
    // Mortarboard.
    degree: (
      <>
        <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
        <path d="M6 11.3v4.2c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.2" />
        <path d="M22 9.5v5" />
      </>
    ),
    // Rosette with ribbons.
    bar: (
      <>
        <circle cx="12" cy="9" r="5.5" />
        <circle cx="12" cy="9" r="2.5" />
        <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
      </>
    ),
    // Document with lines.
    experience: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 11h6M9 14.5h6M9 18h4" />
      </>
    ),
    // Scales.
    practice: (
      <>
        <path d="M12 3.5v16M8 20.5h8M5 6.5h14" />
        <path d="M5 6.5 2.5 13h5zM19 6.5 16.5 13h5z" />
        <path d="M2.5 13a2.5 2.2 0 0 0 5 0M16.5 13a2.5 2.2 0 0 0 5 0" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
