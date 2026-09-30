import Image from "next/image";
import Link from "next/link";
import type { Person, Spotlight } from "@/content/people";
import { publicImage } from "@/lib/public-image";
import { AutoSlider } from "@/components/auto-slider";

/**
 * The home page's "Our people" band: one person per slide. The portrait sits
 * on a navy panel on the left inside an offset gold frame; on the right, the
 * name, designation, a short introduction, three credentials and a link to
 * the full profile. Slides advance on their own and pause under the cursor
 * (`auto-slider.tsx`), and a row of tabs under the slider — portrait, name
 * and designation for each person — shows who is next and jumps to them.
 *
 * The portrait falls back to a silhouette until `photo` or `photoUrl` is set
 * on the person, the same convention `person-card.tsx` uses on the About
 * page. The introduction and credentials come from `spotlight`, and are left
 * out when it isn't set.
 */
function photoFor(person: Person): string | null {
  return person.photoUrl ?? (person.photo ? publicImage(person.photo) : null);
}

export function PeopleCards({ people }: { people: readonly Person[] }) {
  return (
    <AutoSlider
      label="Our people"
      interval={6000}
      tabs={people.map((person) => (
        <PersonTab key={person.slug} person={person} />
      ))}
    >
      {people.map((person) => (
        <PersonSlide key={person.slug} person={person} />
      ))}
    </AutoSlider>
  );
}

function PersonTab({ person }: { person: Person }) {
  const photo = photoFor(person);

  return (
    <span className="flex items-center justify-center gap-3 sm:justify-start">
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink-mid ring-2 ring-gold/40">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            sizes="44px"
            unoptimized={Boolean(person.photoUrl)}
            className="object-cover object-top"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
            {person.initials}
          </span>
        )}
      </span>
      {/* Portrait only on phones, where three names will not fit across. */}
      <span className="sr-only min-w-0 sm:not-sr-only">
        <span className="block truncate font-serif text-sm font-semibold text-ink sm:text-base">
          {person.name}
        </span>
        <span className="mt-0.5 hidden truncate text-xs uppercase tracking-[0.18em] text-gold-deep sm:block">
          {person.designation}
        </span>
      </span>
    </span>
  );
}

function PersonSlide({ person }: { person: Person }) {
  const photo = photoFor(person);

  return (
    <article className="grid overflow-hidden rounded-2xl border border-line bg-paper shadow-sm md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Portrait on a navy panel, with a thin gold frame set off behind it
          to the right and a soft gold glow behind the sitter. */}
      <div className="relative flex items-center justify-center overflow-hidden bg-[linear-gradient(160deg,var(--color-navy-soft),var(--color-ink-deep))] px-8 py-8 sm:py-10">
        <div
          aria-hidden="true"
          className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full border border-gold/20"
        />
        <div className="relative w-full max-w-[14rem] pr-3 pb-3 sm:max-w-[19rem] sm:pr-4 sm:pb-4">
          <div
            aria-hidden="true"
            className="absolute inset-0 left-3 top-3 rounded-sm sm:left-4 sm:top-4 border border-gold"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm shadow-lg shadow-ink/15">
            {photo ? (
              <Image
                src={photo}
                alt={`Portrait of ${person.name}`}
                fill
                sizes="(min-width: 640px) 19rem, 14rem"
                quality={90}
                unoptimized={Boolean(person.photoUrl)}
                className="object-cover object-top"
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
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-10 lg:px-14">
        <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {person.name}
        </h3>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep sm:text-sm">
          {person.designation}
        </p>
        <span aria-hidden="true" className="mt-4 block h-px w-12 bg-gold sm:mt-6" />

        {person.spotlight && <SpotlightBody spotlight={person.spotlight} />}

        <Link
          href={`/about#${person.slug}`}
          className="group mt-6 inline-flex self-start items-center gap-3 rounded-lg border border-gold px-5 py-2.5 sm:mt-8 sm:px-6 sm:py-3 text-sm font-semibold text-ink transition hover:bg-gold hover:text-white"
        >
          View Profile
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
            <path
              d="M2 8h11M9 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="sr-only">of {person.name}</span>
        </Link>
      </div>
    </article>
  );
}

function SpotlightBody({ spotlight }: { spotlight: Spotlight }) {
  return (
    <>
      <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-base">
        {spotlight.summary}
      </p>
      <span aria-hidden="true" className="mt-6 block h-px w-12 bg-gold sm:mt-8" />

      <ul className="mt-6 grid grid-cols-3 sm:mt-8 divide-x divide-line">
        {spotlight.credentials.map((item) => (
          <li key={item.title} className="flex flex-col items-center px-2 text-center">
            <CredentialIcon name={item.icon} />
            <span className="mt-3 text-sm font-semibold text-ink">{item.title}</span>
            <span className="mt-0.5 text-xs text-slate sm:text-sm">{item.detail}</span>
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
