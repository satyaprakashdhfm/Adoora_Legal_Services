import type { Differentiator } from "@/content/firm";
import { WhyUsIcon } from "@/components/why-us-icon";

/**
 * The "Why partner with us" band, redrawn as a hub-and-spoke diagram after
 * the client found the photographic cards unappealing — five capabilities
 * radiating from a central line, each a numbered node with its own icon.
 *
 * The radial layout only reads at width, so it renders from `lg` up. Below
 * that this falls back to a plain numbered list carrying the same content,
 * rather than trying to force five spokes into a phone-width screen.
 */

const ANGLES_DEG = [-90, -18, 54, 126, 198];
/** Where the spoke line starts, in % of the container's width from centre. */
const LINE_START = 15;
/** Where the spoke line — and each node — sits, in the same units. */
const NODE_RADIUS = 33;

function spokePosition(index: number) {
  const rad = (ANGLES_DEG[index] * Math.PI) / 180;
  return { cos: Math.cos(rad), sin: Math.sin(rad) };
}

export function WhyUsWheel({ items }: { items: readonly Differentiator[] }) {
  return (
    <>
      {/* The radial diagram. A square canvas keeps the trigonometry honest —
          percentages of width and height line up only when they're equal. */}
      <div className="relative mx-auto hidden aspect-square max-w-[38rem] lg:block">
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          {items.map((item, index) => {
            const { cos, sin } = spokePosition(index);
            return (
              <line
                key={item.title}
                x1={50 + LINE_START * cos}
                y1={50 + LINE_START * sin}
                x2={50 + NODE_RADIUS * cos}
                y2={50 + NODE_RADIUS * sin}
                stroke="var(--color-line-strong)"
                strokeWidth={0.4}
              />
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-ink text-center shadow-lg">
          <span className="font-serif text-[0.68rem] font-semibold leading-[1.7] tracking-[0.22em] text-gold-bright">
            A STRONGER
            <br />
            TOMORROW
            <br />
            TOGETHER
          </span>
        </div>

        {items.map((item, index) => {
          const { cos, sin } = spokePosition(index);
          return (
            <div
              key={item.title}
              className="absolute flex w-48 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
              style={{
                left: `${50 + NODE_RADIUS * cos}%`,
                top: `${50 + NODE_RADIUS * sin}%`,
              }}
            >
              <span className="font-serif text-sm font-semibold text-gold-deep">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-2 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper">
                <WhyUsIcon index={index} className="h-6 w-6 text-gold-deep" />
              </span>
              <h3 className="mt-3 font-serif text-base font-semibold leading-snug tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          );
        })}
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
