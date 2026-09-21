import type { Differentiator } from "@/content/firm";
import { WhyUsIcon } from "@/components/why-us-icon";

/**
 * The "Why partner with us" band, drawn as a horizontal timeline — five
 * numbered nodes strung along one spine, captions alternating above and
 * below so neighbouring items don't collide. Redrawn from a circular
 * hub-and-spoke layout: the client's reference image inspired the
 * spine-and-node idea, but a fixed-width circle centred in a wide section
 * left large empty margins either side on a laptop screen. A row of five
 * fills the same width the section's other bands use, so it lines up with
 * the heading above rather than floating in the middle of the page.
 *
 * Below `lg` there isn't room for five columns, so it falls back to a plain
 * numbered card list carrying the same content.
 */

function TextBlock({ item, index }: { item: Differentiator; index: number }) {
  return (
    <div className="max-w-[13rem]">
      <span className="font-serif text-sm font-semibold text-gold-deep">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-1 font-serif text-base font-semibold leading-snug tracking-tight text-ink">
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
    <>
      <div className="hidden lg:block">
        {/* Captions for the items that sit above the spine. */}
        <div className="grid grid-cols-5 gap-x-6">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col items-center justify-end pb-5 text-center"
            >
              {index % 2 === 0 && <TextBlock item={item} index={index} />}
            </div>
          ))}
        </div>

        {/* The spine, with every item's icon strung along it. */}
        <div className="relative grid grid-cols-5 gap-x-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-line-strong"
          />
          {items.map((item, index) => (
            <div key={item.title} className="flex justify-center">
              <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper">
                <WhyUsIcon index={index} className="h-7 w-7 text-gold-deep" />
              </span>
            </div>
          ))}
        </div>

        {/* Captions for the items that sit below the spine. */}
        <div className="grid grid-cols-5 gap-x-6">
          {items.map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col items-center pt-5 text-center"
            >
              {index % 2 === 1 && <TextBlock item={item} index={index} />}
            </div>
          ))}
        </div>
      </div>

      {/* Below `lg`, the same five items as a plain numbered list. */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:hidden">
        {items.map((item, index) => (
          <li
            key={item.title}
            className="flex gap-4 rounded-xl border border-line bg-paper p-5"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-warm">
              <WhyUsIcon index={index} className="h-5 w-5 text-gold-deep" />
            </span>
            <div>
              <span className="font-serif text-xs font-semibold text-gold-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-serif text-base font-semibold leading-snug tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
