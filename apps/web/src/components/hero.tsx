"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { heroSlides } from "@/content/hero-slides";
import { firm } from "@/content/firm";

const ROTATE_MS = 7000;

/** Right-pointing arrow used on the primary calls to action. */
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

  /*
   * The cursor-following prev/next hint: a floating arrow that tracks the
   * mouse and points the direction a click there will move the slideshow —
   * left half steps back, right half steps forward, matching the click zones
   * `onPointerUp` already acts on. Mouse only (a touch does not "hover"), and
   * hidden over a link or button so it never sits on top of the real controls.
   */
  const [hint, setHint] = useState<{ x: number; y: number; side: "prev" | "next" } | null>(null);

  function onMouseMove(event: ReactMouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a, button")) {
      setHint(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    setHint({
      x,
      y: event.clientY - rect.top,
      side: x < rect.width / 2 ? "prev" : "next",
    });
  }

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

  /*
   * Drag/swipe, mouse or touch, via the Pointer Events API — one code path
   * for both rather than separate mouse and touch handlers. A real swipe
   * (past the threshold) moves in the dragged direction; a plain click or
   * tap that never crossed it instead falls back to a left/right zone —
   * the classic carousel tap targets — so clicking either side of the
   * photograph, not just dragging it, moves the slide. Either way a click
   * that landed on a link or button (the CTAs, the position dots) is left
   * alone for that element's own handler.
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
      setIndex((current) =>
        delta < 0
          ? (current + 1) % heroSlides.length
          : (current - 1 + heroSlides.length) % heroSlides.length,
      );
      return;
    }

    // Not a swipe. A link or button under the pointer handles its own
    // click — the "Corporate & M&A" CTA, "Request information", a position
    // dot — so leave the slide alone rather than also advancing under it.
    if ((event.target as HTMLElement).closest("a, button")) return;

    // A plain click or tap on the photograph itself: which half of the
    // section decides the direction.
    const rect = event.currentTarget.getBoundingClientRect();
    const clickedRightHalf = event.clientX - rect.left > rect.width / 2;

    setIndex((current) =>
      clickedRightHalf
        ? (current + 1) % heroSlides.length
        : (current - 1 + heroSlides.length) % heroSlides.length,
    );
  }

  return (
    <section
      className="relative isolate touch-pan-y overflow-hidden bg-ink-mid text-white select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setHint(null);
      }}
      onMouseMove={onMouseMove}
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
                  className={`hero-slide col-start-1 row-start-1 ${
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

      {/* Cursor-following prev/next hint. A direct child of the section, so
          it shares the same coordinate space `onMouseMove` measures against —
          nesting it inside `container-page` would offset it by that div's
          padding and, on very wide screens, its centring margin. The
          transform (not top/left) keeps it pinned to the pointer without
          layout thrash. `hidden md:block` because this is a hover affordance;
          small screens use the swipe gesture instead. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-20 hidden md:block ${
          hint ? "opacity-100" : "opacity-0"
        } transition-opacity duration-150`}
      >
        <div
          className="absolute flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-ink-mid/60 text-white backdrop-blur-sm transition-transform duration-150"
          style={{
            transform: `translate(${(hint?.x ?? 0) - 28}px, ${(hint?.y ?? 0) - 28}px)`,
          }}
        >
          <Arrow className={hint?.side === "prev" ? "-scale-x-100" : ""} />
        </div>
      </div>
    </section>
  );
}
