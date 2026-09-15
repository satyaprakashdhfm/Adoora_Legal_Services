import Image from "next/image";
import type { CSSProperties } from "react";
import type { Person } from "@/content/people";
import { publicImage } from "@/lib/public-image";

/**
 * Six soft accents the roster cycles through, card by card. Each sets the
 * avatar ring, a faint wash at the top of the card, the rule along its foot,
 * and the designation text — the last darkened on its own until it clears
 * 4.5:1 on the white card, because the pastel that works as a fill does not
 * work as type.
 */
const accents = [
  { soft: "#f6e6d4", wash: "#fdf6ee", bar: "#e3bc8c", text: "#9a6224" }, // sand
  { soft: "#dde8f7", wash: "#f3f7fd", bar: "#9dbbe5", text: "#3b5b8c" }, // blue
  { soft: "#d9ede3", wash: "#f2f9f5", bar: "#8fc7aa", text: "#3f7a5e" }, // sage
  { soft: "#f8dfe0", wash: "#fdf4f4", bar: "#e9a7ae", text: "#a2475a" }, // rose
  { soft: "#e6e1f5", wash: "#f6f4fc", bar: "#b8ade3", text: "#5d4f96" }, // lavender
  { soft: "#f8e8c9", wash: "#fdf8ee", bar: "#e8c67f", text: "#8a6414" }, // amber
] as const;

/**
 * A person's card on the About page roster: a round portrait, name and
 * designation, with an accent bar along the foot.
 *
 * No photographs have been supplied yet, so the portrait is a silhouette on
 * the card's accent. Set `photo` on the person in `people.ts` to the base name
 * of a file in `public/` and the photograph fills the circle instead — square
 * crops with the face centred work best.
 *
 * `index` picks the accent, so neighbouring cards differ.
 */
export function PersonCard({
  person,
  index = 0,
}: {
  person: Person;
  index?: number;
}) {
  const photo = person.photo ? publicImage(person.photo) : null;
  const accent = accents[index % accents.length];

  return (
    <article
      style={
        {
          "--accent-soft": accent.soft,
          "--accent-wash": accent.wash,
          "--accent-bar": accent.bar,
          "--accent-text": accent.text,
        } as CSSProperties
      }
      className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-line bg-[linear-gradient(to_bottom,var(--accent-wash)_0%,var(--color-paper)_55%)] px-5 pb-7 pt-7 text-center shadow-sm shadow-ink/[0.03] transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[var(--accent-soft)] ring-4 ring-paper transition duration-300 group-hover:scale-105">
        {photo ? (
          <Image
            src={photo}
            alt={person.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          /* Head and shoulders, cut off by the circle at the foot. */
          <svg
            viewBox="0 0 96 96"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full text-[#9aa1ab]"
            fill="currentColor"
          >
            <circle cx="48" cy="37" r="17" />
            <path d="M14 96c0-22.6 15.2-38 34-38s34 15.4 34 38z" />
          </svg>
        )}
      </div>

      <h3 className="mt-5 font-sans text-[0.95rem] font-semibold leading-snug text-ink">
        {person.name}
      </h3>
      <p className="mt-1 font-sans text-sm font-medium text-[var(--accent-text)]">
        {person.designation}
      </p>
      {person.qualification && (
        <p className="mt-0.5 font-sans text-xs text-slate">{person.qualification}</p>
      )}

      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--accent-bar)]"
      />
    </article>
  );
}
