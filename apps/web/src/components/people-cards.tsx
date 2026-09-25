import Image from "next/image";
import Link from "next/link";
import type { Person, Spotlight } from "@/content/people";
import { publicImage } from "@/lib/public-image";
import { AutoSlider } from "@/components/auto-slider";

/**
 * The home page's "Our people" band: one person per slide, portrait on the
 * left inside an offset gold frame, and on the right the name, designation,
 * a short introduction, three credentials and a link to the full profile.
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
    <article className="grid items-center gap-10 rounded-2xl border border-line bg-paper p-6 shadow-sm sm:p-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:p-12">
      {/* Portrait, with a thin gold frame set off behind it to the right. */}
      <div className="relative mx-auto w-full max-w-xs pr-4 pb-4 sm:max-w-sm">
        <div
          aria-hidden="true"
          className="absolute inset-0 left-4 top-4 rounded-sm border border-gold"
        />
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm shadow-lg shadow-ink/15">
          {photo ? (
            <Image
              src={photo}
              alt={`Portrait of ${person.name}`}
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
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

      <div>
        <h3 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {person.name}
        </h3>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep sm:text-sm">
          {person.designation}
        </p>
        <span aria-hidden="true" className="mt-6 block h-px w-12 bg-gold" />

        {person.spotlight && <SpotlightBody spotlight={person.spotlight} />}

        <Link
          href={`/about#${person.slug}`}
          className="group mt-8 inline-flex items-center gap-3 rounded-lg border border-gold px-6 py-3 text-sm font-semibold text-ink transition hover:bg-gold hover:text-white"
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
      <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
        {spotlight.summary}
      </p>
      <span aria-hidden="true" className="mt-8 block h-px w-12 bg-gold" />

      <ul className="mt-8 grid grid-cols-3 divide-x divide-line">
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
