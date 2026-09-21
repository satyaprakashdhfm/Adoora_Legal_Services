import Image from "next/image";
import type { Differentiator } from "@/content/firm";

/**
 * The "Why partner with us" band — five numbered photographs strung along
 * one spine, captions alternating above and below so neighbouring items
 * don't collide.
 *
 * Line-icon nodes on a bare background read as flat, so each node carries
 * the firm's own photography instead — the same five images the section
 * used before it was a diagram, now cropped into a ring rather than a
 * rectangle — with the number as a badge on the photo. The whole band sits
 * in a tinted panel so it reads as one composed piece rather than floating
 * on the page.
 *
 * A row of five fills the same width the section's other bands use — a
 * fixed-width circle centred in a wide section left large empty margins on
 * a laptop screen, which is what this replaced.
 *
 * Below `lg` there isn't room for five columns, so it falls back to a plain
 * numbered card list carrying the same photos and copy.
 */

function Node({ item, index }: { item: Differentiator; index: number }) {
  return (
    <div className="relative h-20 w-20 shrink-0">
      <div className="h-full w-full overflow-hidden rounded-full border-4 border-paper shadow-[0_0_0_1px_var(--color-line-strong),0_8px_20px_-8px_rgb(11_24_52_/_0.35)]">
        <div className="relative h-full w-full">
          <Image
            src={item.image}
            alt=""
            fill
            sizes="5rem"
            style={{ objectPosition: item.focus }}
            className="object-cover"
          />
        </div>
      </div>
      <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[0.7rem] font-serif font-semibold text-gold-bright ring-4 ring-paper">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

function TextBlock({ item }: { item: Differentiator }) {
  return (
    <div className="max-w-[13rem]">
      <h3 className="font-serif text-base font-semibold leading-snug tracking-tight text-ink">
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
        {item.body}
      </p>
    </div>
  );
}

export function WhyUsWheel({ items }: { items: readonly Differentiator[] }) {
  return (
    <div className="rounded-3xl border border-line bg-[linear-gradient(160deg,var(--color-paper-warm),var(--color-paper)_65%)] p-8 sm:p-10 lg:p-14">
      <div className="hidden lg:block">
        {/* Captions for the items that sit above the spine. */}
        <div className="grid grid-cols-5 gap-x-6">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col items-center justify-end pb-6 text-center"
            >
              {index % 2 === 0 && <TextBlock item={item} />}
            </div>
          ))}
        </div>

        {/* The spine, with every item's photograph strung along it. */}
        <div className="relative grid grid-cols-5 gap-x-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(to_right,transparent,var(--color-gold)_15%,var(--color-gold)_85%,transparent)] opacity-40"
          />
          {items.map((item, index) => (
            <div key={item.title} className="flex justify-center">
              <div className="relative z-10">
                <Node item={item} index={index} />
              </div>
            </div>
          ))}
        </div>

        {/* Captions for the items that sit below the spine. */}
        <div className="grid grid-cols-5 gap-x-6">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col items-center pt-6 text-center"
            >
              {index % 2 === 1 && <TextBlock item={item} />}
            </div>
          ))}
        </div>
      </div>

      {/* Below `lg`, the same five items as a plain numbered list. */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:hidden">
        {items.map((item, index) => (
          <li key={item.title} className="flex gap-4 rounded-xl bg-paper p-5">
            <Node item={item} index={index} />
            <TextBlock item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
