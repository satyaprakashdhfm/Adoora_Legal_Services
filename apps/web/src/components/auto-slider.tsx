"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

/**
 * One slide at a time, advancing on its own every `interval` ms and looping
 * back to the first. Hovering or focusing a slide pauses it, so a reader is
 * never pulled away from what they are reading; the arrows step back and
 * forth (wrapping at either end) and the dots jump straight to a slide. Readers who ask for reduced motion get no autoplay at all.
 *
 * Slides off screen are `inert`, so keyboard focus can't land on a link the
 * reader can't see.
 *
 * Pass `tabs` (one node per slide) to replace the dots with a row of labelled
 * tabs under the slider; the active tab carries a gold bar that fills over
 * the slide's interval.
 */
export function AutoSlider({
  children,
  interval = 5000,
  label,
  tabs,
}: {
  children: ReactNode;
  interval?: number;
  label: string;
  tabs?: ReactNode[];
}) {
  const slides = Children.toArray(children);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(
      () => setActive((i) => (i + 1) % slides.length),
      interval,
    );
    return () => window.clearTimeout(id);
  }, [active, paused, slides.length, interval]);

  function step(direction: 1 | -1) {
    setActive((i) => (i + direction + slides.length) % slides.length);
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setPaused(false);
        }}
      >
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {slides.map((slide, i) => (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={i !== active}
                inert={i !== active}
                className="w-full shrink-0"
              >
                {slide}
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <ArrowButton direction={-1} onClick={() => step(-1)} />
            <ArrowButton direction={1} onClick={() => step(1)} />
          </>
        )}
      </div>

      {slides.length > 1 && tabs && (
        <div
          className="mt-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active}
              className={`relative overflow-hidden rounded-xl border px-3 py-3 text-left transition sm:px-4 ${
                i === active
                  ? "border-gold/70 bg-paper shadow-md shadow-ink/5"
                  : "border-line bg-paper/60 hover:border-gold/50 hover:bg-paper"
              }`}
            >
              {tab}
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-line" />
              {i === active && (
                /* Keyed on the pause too: the timer restarts in full after a
                   pause, so the bar starts over with it rather than drifting. */
                <span
                  key={`${active}-${paused}`}
                  aria-hidden="true"
                  className="slide-progress absolute inset-x-0 bottom-0 h-0.5 bg-gold"
                  style={{
                    animationDuration: `${interval}ms`,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {slides.length > 1 && !tabs && (
        <div className="mt-5 flex items-center justify-center gap-2 sm:mt-6">
          {/* On phones the arrows sit here, beside the dots, rather than
              over the slide where they would cover its text. */}
          <ArrowButton direction={-1} onClick={() => step(-1)} inline />
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active
                  ? "w-8 bg-gold"
                  : "w-2 bg-line-strong hover:bg-gold/60"
              }`}
            />
          ))}
          <ArrowButton direction={1} onClick={() => step(1)} inline />
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  direction,
  onClick,
  inline = false,
}: {
  direction: 1 | -1;
  onClick: () => void;
  /** The phone-only pair beside the dots, instead of the pair over the slide. */
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? "Next slide" : "Previous slide"}
      className={`items-center justify-center rounded-full border border-line-strong bg-paper text-ink transition hover:border-gold hover:bg-gold hover:text-white ${
        inline
          ? `flex h-9 w-9 md:hidden ${direction === 1 ? "ml-2" : "mr-2"}`
          : `absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 shadow-md md:flex ${
              direction === 1 ? "right-0 translate-x-1/3" : "left-0 -translate-x-1/3"
            }`
      }`}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
        <path
          d={direction === 1 ? "M2 8h11M9 4l4 4-4 4" : "M14 8H3M7 4L3 8l4 4"}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
