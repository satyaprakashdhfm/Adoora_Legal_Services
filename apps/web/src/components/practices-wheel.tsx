import Image from "next/image";
import Link from "next/link";
import type { PracticeArea } from "@/content/types";
import { publicImage } from "@/lib/public-image";

/**
 * The home page's practice teaser, drawn as a ring of photographs around a
 * line of standing copy — nine practices arranged evenly around a circle,
 * each a photo and a label rather than a card. `/services` keeps the dense,
 * bulleted index (`PracticesIndex`) for a visitor who has already arrived
 * looking for a case type; this is the lighter teaser that gets them there.
 *
 * Below `lg` a ring reads as clutter, so it falls back to a plain grid of
 * the same photos and labels.
 */

const RING_RADIUS = 34;
/** Where labels anchor — further out than the photo, along the same ray. */
const LABEL_RADIUS = 47;

function ringPosition(index: number, count: number) {
  const angle = -90 + index * (360 / count);
  const rad = (angle * Math.PI) / 180;
  return { cos: Math.cos(rad), sin: Math.sin(rad) };
}

export function PracticesWheel({ items }: { items: readonly PracticeArea[] }) {
  const count = items.length;

  return (
    <>
      <div className="relative mx-auto hidden aspect-square max-w-[54rem] lg:block">
        {/* The ring the photographs sit on. */}
        <div
          aria-hidden="true"
          className="absolute rounded-full border border-dashed border-line-strong"
          style={{
            left: "50%",
            top: "50%",
            width: `${RING_RADIUS * 2}%`,
            height: `${RING_RADIUS * 2}%`,
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Standing copy at the centre. */}
        <div className="absolute left-1/2 top-1/2 flex w-48 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
          <span aria-hidden="true" className="h-px w-9 bg-gold" />
          <p className="mt-4 font-serif text-xl leading-snug text-ink">
            Expertise across a wider horizon.
          </p>
          <span aria-hidden="true" className="mt-4 h-px w-9 bg-gold" />
        </div>

        {items.map((item, index) => {
          const { cos, sin } = ringPosition(index, count);
          const photo = publicImage(`practice-${item.slug}`);
          const side = cos > 0.35 ? "right" : cos < -0.35 ? "left" : "center";

          return (
            <div key={item.slug}>
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${50 + RING_RADIUS * cos}%`,
                  top: `${50 + RING_RADIUS * sin}%`,
                }}
              >
                <Link
                  href={`/services/${item.slug}`}
                  className="group block h-24 w-24 overflow-hidden rounded-full border-4 border-paper shadow-[0_0_0_1px_var(--color-line-strong)] transition hover:shadow-[0_0_0_1px_var(--color-gold)]"
                >
                  {photo && (
                    <div className="relative h-full w-full">
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="6rem"
                        className="object-cover transition duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                </Link>
              </div>

              <div
                className={`absolute w-40 -translate-y-1/2 ${
                  side === "right"
                    ? "text-left"
                    : side === "left"
                      ? "-translate-x-full text-right"
                      : "-translate-x-1/2 text-center"
                }`}
                style={{
                  left: `${50 + LABEL_RADIUS * cos}%`,
                  top: `${50 + LABEL_RADIUS * sin}%`,
                }}
              >
                <Link
                  href={`/services/${item.slug}`}
                  className="font-serif text-lg font-semibold leading-snug text-ink transition hover:text-gold-deep"
                >
                  {item.shortName}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Below `lg`, the same photos and labels as a plain grid. */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:hidden">
        {items.map((item) => {
          const photo = publicImage(`practice-${item.slug}`);
          return (
            <li key={item.slug} className="flex flex-col items-center text-center">
              <Link
                href={`/services/${item.slug}`}
                className="group block h-20 w-20 overflow-hidden rounded-full border-4 border-paper shadow-[0_0_0_1px_var(--color-line-strong)] transition hover:shadow-[0_0_0_1px_var(--color-gold)]"
              >
                {photo && (
                  <div className="relative h-full w-full">
                    <Image
                      src={photo}
                      alt=""
                      fill
                      sizes="5rem"
                      className="object-cover transition duration-300 group-hover:scale-110"
                    />
                  </div>
                )}
              </Link>
              <Link
                href={`/services/${item.slug}`}
                className="mt-3 font-serif text-base font-semibold leading-snug text-ink transition hover:text-gold-deep"
              >
                {item.shortName}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
