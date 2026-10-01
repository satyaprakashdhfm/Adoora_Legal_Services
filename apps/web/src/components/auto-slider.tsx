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
 */
export function AutoSlider({
  children,
  interval = 5000,
  label,
}: {
  children: ReactNode;
  interval?: number;
  label: string;
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
                className="flex w-full shrink-0 [&>*]:w-full"
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

      {slides.length > 1 && (
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
          d={direction === 1 ? "M6 3.5 10.5 8 6 12.5" : "M10 3.5 5.5 8l4.5 4.5"}
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
