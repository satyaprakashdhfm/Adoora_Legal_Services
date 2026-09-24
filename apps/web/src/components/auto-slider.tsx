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

      {slides.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
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
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: 1 | -1;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 1 ? "Next slide" : "Previous slide"}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-paper text-ink shadow-md transition hover:border-gold hover:bg-gold hover:text-white ${
        direction === 1 ? "right-0 translate-x-1/3" : "left-0 -translate-x-1/3"
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
