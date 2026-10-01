"use client";

import { titleCase } from "@/lib/title-case";
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
      aria-label="About the firm"
    >
      {/* One photograph per slide, cross-fading with the copy. The navy wash
          sits above all of them, so the left-hand column reads identically
          whichever frame is showing — except the team photograph, which is
          never washed over (see below). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {heroSlides.map((slide, slideIndex) => {
          const src = images[slideIndex];
          if (!src) return null;

          const image = (
            <Image
              src={src}
              alt=""
              fill
              sizes="100vw"
              className={`object-cover ${slide.people ? "object-top" : "object-right"}`}
              /* The first frame is the LCP element; the others only need
                 to be in hand before the rotation reaches them. */
              {...(slideIndex === 0
                ? { preload: true }
                : { loading: "eager" as const, fetchPriority: "low" as const })}
            />
          );

          return (
            <div
              key={slide.eyebrow}
              className={`hero-slide absolute inset-0 ${
                slideIndex === index ? "opacity-100" : "opacity-0"
              }`}
            >
              {slide.people ? (
                /* The team at its own proportions across the full width,
                   pinned to the top: nobody is cut off at the sides, and the
                   faces sit in the upper half, clear of the copy band. Below
                   the photograph (on tall, narrow screens) the navy of the
                   section carries on, faded into the photograph's own. On a
                   phone the whole row would be a thin strip, so there it fills
                   the top half instead, centred on the middle of the team. */
                <div
                  className="absolute inset-x-0 top-0 h-1/2 sm:h-auto sm:[aspect-ratio:var(--hero-aspect)]"
                  style={{ "--hero-aspect": slide.imageAspect } as React.CSSProperties}
                >
                  {image}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ink-mid to-transparent" />
                </div>
              ) : (
                image
              )}
              {slide.bright && (
                <div className="hero-bright-lift absolute inset-0" />
              )}
            </div>
          );
        })}

        <div
          className={`hero-scrim hero-slide absolute inset-0 ${
            active.people ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      <div className="container-page relative flex flex-col justify-center pb-28 pt-16 sm:pt-20 lg:min-h-[min(calc(100svh-14rem),38rem)] lg:pt-16">
        <div className="max-w-3xl">
          {/* Slides are stacked so the container height does not jump between
              headings of different lengths. The team slide is not among them:
              its copy is the band along the foot, below. */}
          <div className="grid">
            {heroSlides.map((slide, slideIndex) => {
              if (slide.people) return null;
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

                  <h1 className="mt-4 font-serif text-[1.7rem] font-semibold leading-[1.15] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] xl:text-[3.15rem]">
                    {titleCase(slide.heading)}{" "}
                    <span className="text-gold-bright">{titleCase(slide.accent)}</span>
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                    {slide.body}
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={slide.href}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5 text-ink-deep transition hover:bg-gold-bright"
                    >
                      {slide.cta}
                      <Arrow />
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold sm:px-7 sm:py-3.5 text-white transition hover:border-white hover:bg-white/5"
                    >
                      Request information
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Standing line from the firm's own collateral. Stood down on the
            team slide, whose copy band runs the full width. */}
        <p
          className={`hero-copy mt-12 max-w-[13rem] font-serif text-sm italic leading-relaxed text-white/75 lg:absolute lg:bottom-10 lg:right-10 lg:mt-0 lg:text-right 2xl:right-16 ${
            active.people ? "opacity-0" : ""
          }`}
        >
          &ldquo;{firm.heroQuote}&rdquo;
        </p>
      </div>

      {/* The team slide's copy: a low band across the foot of the hero, over
          the jackets rather than the faces — heading on the left, the rest on
          the right on wide screens. */}
      {heroSlides.map((slide, slideIndex) => {
        if (!slide.people) return null;
        const isActive = slideIndex === index;

        return (
          <div
            key={slide.eyebrow}
            className={`hero-copy absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-deep via-ink-deep/90 to-transparent pb-24 pt-12 ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            <div className="container-page grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
              <div>
                <p className="eyebrow text-gold-bright">{slide.eyebrow}</p>
                <h1 className="mt-3 font-serif text-2xl font-semibold leading-[1.15] tracking-tight text-balance sm:text-3xl xl:text-[2.4rem]">
                  {titleCase(slide.heading)}{" "}
                  <span className="text-gold-bright">{titleCase(slide.accent)}</span>
                </h1>
              </div>
              <div>
                <p className="text-sm leading-relaxed text-white/85 sm:text-base">{slide.body}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={slide.href}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
                  >
                    {slide.cta}
                    <Arrow />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5"
                  >
                    Request information
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide controls along the foot, for every slide: previous, a rule per
          slide (gold when active), next. The explicit way to move the
          slideshow, since neither tapping the photograph nor moving the cursor
          over it does; kept together at the bottom so they never sit over a
          heading or a face. */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="container-page flex items-center gap-3 pb-6">
          {heroSlides.length > 1 && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous slide"
              className="mr-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur-sm transition hover:border-gold hover:bg-gold hover:text-ink-deep"
            >
              <Arrow className="-scale-x-100" />
            </button>
          )}
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
          {heroSlides.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next slide"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-ink/40 text-white backdrop-blur-sm transition hover:border-gold hover:bg-gold hover:text-ink-deep"
            >
              <Arrow />
            </button>
          )}
          <span className="sr-only" aria-live="polite">
            {active.eyebrow}
          </span>
        </div>
      </div>
    </section>
  );
}
