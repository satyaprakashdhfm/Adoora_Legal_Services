import type { Person } from "@/content/people";

/**
 * A person's roster card: initials, name, designation.
 *
 * Shared by the About page roster and the home-page team band so the two
 * cannot drift. Photography is not supplied, so the avatar is the initials —
 * see the note at the top of `people.ts` for why nothing here is invented.
 */
export function PersonCard({ person }: { person: Person }) {
  return (
    <div className="flex h-full items-center gap-4 rounded-xl border border-line bg-paper p-5">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-warm font-serif text-sm font-semibold text-gold-deep"
      >
        {person.initials}
      </span>
      <div className="min-w-0">
        <p className="font-serif font-semibold leading-snug tracking-tight text-ink">
          {person.name}
        </p>
        <p className="mt-1 text-sm text-gold-deep">
          {person.designation}
          {person.qualification && (
            <span className="text-slate"> &middot; {person.qualification}</span>
          )}
        </p>
      </div>
    </div>
  );
}
