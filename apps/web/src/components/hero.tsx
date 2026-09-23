"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { heroSlides } from "@/content/hero-slides";
import { firm } from "@/content/firm";

const ROTATE_MS = 7000;

/** Right-pointing arrow used on the primary calls to action, and on the
    prev/next controls (flipped for prev). */
function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 ${className}`}>
      <path
        d="M2 8h11M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * `images` is resolved on the server, one entry per slide in `heroSlides`
 * order, so a photograph that has not been supplied yet is simply null and the
 * navy gradient carries that slide on its own.
 */
export function Hero({ images }: { images: (string | null)[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);
  /* Drag tracking for the swipe gesture. `startX` is null when no drag is in
     progress, which also doubles as "ignore this pointer's move/up events". */
  const dragRef = useRef<{ startX: number; moved: boolean } | null>(null);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (paused || reducedMotion.current) return;

    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % heroSlides.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const active = heroSlides[index];

  function goNext() {
    setIndex((current) => (current + 1) % heroSlides.length);
  }

  function goPrev() {
    setIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  }

  /*
   * A real drag/swipe past the threshold, mouse or touch, moves in the
   * dragged direction — via the Pointer Events API, one code path for both.
   * A plain click or tap that never crossed the threshold does nothing here:
   * the prev/next buttons below are the explicit control, so the photograph
   * itself no longer doubles as a tap target and the cursor moving over it
   * no longer changes the slide on its own.
   */
  const SWIPE_THRESHOLD = 50;

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    // A right-click, or a second finger while one is already dragging.
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragRef.current = { startX: event.clientX, moved: false };
    setPaused(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!dragRef.current) return;
    if (Math.abs(event.clientX - dragRef.current.startX) > 4) {
      dragRef.current.moved = true;
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    setPaused(false);
    if (!drag) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) goNext();
      else goPrev();
    }
  }

  return (
    <section
      className="relative isolate touch-pan-y overflow-hidden bg-ink-mid text-white select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
        setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="Firm practice highlights"
    >
      {/* One photograph per slide, cross-fading with the copy. The navy wash
          sits above all of them, so the left-hand column reads identically
          whichever frame is showing. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {heroSlides.map((slide, slideIndex) => {
          const src = images[slideIndex];
          if (!src) return null;

          return (
            <div
              key={slide.eyebrow}
              className={`hero-slide absolute inset-0 ${
                slideIndex === index ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-right"
                /* The first frame is the LCP element; the other two only need
                   to be in hand before the rotation reaches them. */
                {...(slideIndex === 0
                  ? { preload: true }
                  : { loading: "eager" as const, fetchPriority: "low" as const })}
              />
              {slide.bright && (
                <div className="hero-bright-lift absolute inset-0" />
              )}
            </div>
          );
        })}

        <div className="hero-scrim absolute inset-0" />
      </div>

      <div className="container-page relative flex flex-col justify-center py-16 sm:py-20 lg:min-h-[min(calc(100svh-7.5rem),46rem)] lg:py-16">
        <div className="max-w-3xl">
          {/* Slides are stacked so the container height does not jump between
              headings of different lengths. */}
          <div className="grid">
            {heroSlides.map((slide, slideIndex) => {
              const isActive = slideIndex === index;

              return (
                <div
                  key={slide.eyebrow}
                  className={`hero-copy col-start-1 row-start-1 ${
                    isActive ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  aria-hidden={!isActive}
                >
                  <p className="eyebrow text-gold-bright">{slide.eyebrow}</p>

                  <h1 className="mt-5 font-serif text-3xl font-semibold leading-[1.12] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] xl:text-[3.15rem]">
                    {slide.heading}{" "}
                    <span className="text-gold-bright">{slide.accent}</span>
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                    {slide.body}
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={slide.href}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-7 py-3.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
                    >
                      {slide.cta}
                      <Arrow />
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-md border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5"
                    >
                      Request information
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slide controls: a rule per slide, filling gold when active. */}
          <div className="mt-10 flex items-center gap-3">
            {heroSlides.map((slide, slideIndex) => {
              const isActive = slideIndex === index;

              return (
                <button
                  key={slide.eyebrow}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  aria-label={`Show slide ${slideIndex + 1}: ${slide.eyebrow}`}
                  aria-current={isActive}
                  className="group flex h-11 items-center"
                >
                  <span
                    aria-hidden="true"
                    className={`block h-0.5 transition-all ${
                      isActive
                        ? "w-12 bg-gold"
                        : "w-8 bg-white/25 group-hover:bg-white/50"
                    }`}
                  />
                </button>
              );
            })}
            <span className="sr-only" aria-live="polite">
              {active.eyebrow}
            </span>
          </div>
        </div>

        {/* Standing line from the firm's own collateral. */}
        <p className="mt-12 max-w-[13rem] font-serif text-sm italic leading-relaxed text-white/75 lg:absolute lg:bottom-10 lg:right-10 lg:mt-0 lg:text-right 2xl:right-16">
          &ldquo;{firm.heroQuote}&rdquo;
        </p>
      </div>

      {/* Prev/next controls — the explicit way to move the slideshow now that
          neither tapping the photograph nor moving the cursor over it does.
          Direct children of the section so they sit above the photograph and
          the copy alike. Anchored to a fixed distance from the bottom rather
          than vertically centred: centring on the whole hero put the button
          over the paragraph text on wide screens, since the copy runs to
          roughly mid-height there. Below the position dots there is nothing
          but photograph on both sides. */}
      {heroSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute bottom-28 left-2 top-auto z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur-sm transition hover:border-gold hover:bg-gold hover:text-ink-deep sm:left-4 sm:h-12 sm:w-12 lg:left-6"
          >
            <Arrow className="-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="absolute bottom-28 right-2 top-auto z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur-sm transition hover:border-gold hover:bg-gold hover:text-ink-deep sm:right-4 sm:h-12 sm:w-12 lg:right-6"
          >
            <Arrow />
          </button>
        </>
      )}
    </section>
  );
}
