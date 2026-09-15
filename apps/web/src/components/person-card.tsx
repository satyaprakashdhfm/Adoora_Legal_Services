import Image from "next/image";
import type { Person } from "@/content/people";
import { publicImage } from "@/lib/public-image";

/**
 * A person's card on the About page roster: a portrait frame above, name and
 * designation below.
 *
 * No photographs have been supplied yet, so the frame holds a drawn silhouette
 * and the person's initials. Set `photo` on the person in `people.ts` to the
 * base name of a file in `public/` and the portrait replaces it — portrait
 * orientation or square, head in the upper third, since the frame crops from
 * the top. Nothing else about the card changes.
 */
export function PersonCard({ person }: { person: Person }) {
  const photo = person.photo ? publicImage(person.photo) : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-paper transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-ink/10">
      <div className="relative aspect-square overflow-hidden bg-[linear-gradient(165deg,var(--color-paper-warm)_0%,var(--color-paper-tint)_100%)]">
        {photo ? (
          <Image
            src={photo}
            alt={person.name}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <>
            {/* Head-and-shoulders silhouette, anchored to the bottom edge so it
                reads as a portrait waiting for its photograph. */}
            <svg
              viewBox="0 0 200 240"
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 mx-auto h-[82%] w-auto text-line-strong/70 transition duration-500 group-hover:text-gold/30"
              fill="currentColor"
            >
              <circle cx="100" cy="86" r="44" />
              <path d="M18 240c0-52 36.7-92 82-92s82 40 82 92z" />
            </svg>
            <span
              aria-hidden="true"
              className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-paper/80 font-serif text-xs font-semibold tracking-wide text-gold-deep backdrop-blur-sm"
            >
              {person.initials}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t-2 border-gold/70 px-5 py-4">
        <h3 className="font-serif text-base font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold-deep">
          {person.name}
        </h3>
        <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold-deep">
          {person.designation}
        </p>
        {person.qualification && (
          <p className="mt-1 text-xs text-slate">{person.qualification}</p>
        )}
      </div>
    </article>
  );
}
