"use client";

import { Children, useEffect, useState, type ReactNode } from "react";

/**
 * One slide at a time, advancing on its own every `interval` ms and looping
 * back to the first. Hovering or focusing a slide pauses it, so a reader is
 * never pulled away from what they are reading; the dots jump straight to a
 * slide. Readers who ask for reduced motion get no autoplay at all.
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

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
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
        <div className="mt-6 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === active ? "w-8 bg-gold" : "w-2 bg-line-strong hover:bg-gold/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
