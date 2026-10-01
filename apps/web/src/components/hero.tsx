"use client";

import { titleCase } from "@/lib/title-case";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import { heroSlides } from "@/content/hero-slides";
import { firm } from "@/content/firm";

const ROTATE_MS = 7000;

/* Phones show the team photograph a few people at a time (see `peopleCount`). */
const PHONE_QUERY = "(max-width: 639px)";
const PEOPLE_PER_FRAME = 3;

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** How many frames a slide takes on a phone: one, or one per three people. */
function phoneFrames(slide: (typeof heroSlides)[number]) {
  return slide.people && slide.peopleCount ? Math.max(1, Math.ceil(slide.peopleCount / PEOPLE_PER_FRAME)) : 1;
}

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
  /* The slideshow steps through `steps`: one per slide, except that on a
     phone the team slide becomes one step per frame of three people. */
  const phone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
  const steps = useMemo(
    () =>
      heroSlides.flatMap((slide, slideIndex) =>
        Array.from({ length: phone ? phoneFrames(slide) : 1 }, (_, frame) => ({ slideIndex, frame })),
      ),
    [phone],
  );
  const [position, setPosition] = useState(0);
  const step = steps[position % steps.length];
  const index = step.slideIndex;
  /* The slideshow holds while the cursor is over the hero, while keyboard
     focus is inside it, and during a drag. Kept apart so ending one (a
     click's pointer-up, say) cannot restart the rotation while another
     still applies. */
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const paused = hovering || focused || dragging;
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
      () => setPosition((current) => ((current % steps.length) + 1) % steps.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [paused, steps.length]);

  const active = heroSlides[index];

  function goNext() {
    setPosition((current) => ((current % steps.length) + 1) % steps.length);
  }

  function goPrev() {
    setPosition((current) => ((current % steps.length) - 1 + steps.length) % steps.length);
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
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    /* Also catches a cursor that was already resting on the hero when the
       page loaded, which never fires an enter event. */
    if (event.pointerType === "mouse" && !hovering) setHovering(true);
    if (!dragRef.current) return;
    if (Math.abs(event.clientX - dragRef.current.startX) > 4) {
      dragRef.current.moved = true;
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragging(false);
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
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={(event) => {
        /* Keyboard focus only: a mouse click also focuses the button it
           lands on, and that should not hold the slideshow once the cursor
           has left. */
        if ((event.target as HTMLElement).matches?.(":focus-visible")) setFocused(true);
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragging(false);
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
              {slide.people && phoneFrames(slide) > 1 && (
                /* Phones: the row three people at a time, one frame per step. */
                <PhoneFrames
                  src={src}
                  aspect={slide.imageAspect ?? "2125 / 740"}
                  frames={phoneFrames(slide)}
                  active={slideIndex === index ? step.frame : -1}
                />
              )}
              {slide.people ? (
                /* The team at its own proportions across the full width,
                   pinned to the top: nobody is cut off at the sides, and the
                   faces sit in the upper half, clear of the copy band. Below
                   the photograph (on tall, narrow screens) the navy of the
                   section carries on, faded into the photograph's own. On a
                   phone the whole row would be a thin strip, so there it fills
                   the top half instead, centred on the middle of the team. */
                <div
                  className={`absolute inset-x-0 top-0 h-1/2 sm:h-auto sm:[aspect-ratio:var(--hero-aspect)] ${
                    phoneFrames(slide) > 1 ? "max-sm:hidden" : ""
                  }`}
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
            className={`hero-copy absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-deep via-ink-deep/90 to-transparent pb-24 pt-12 lg:pb-6 ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            {/* The eyebrow takes its own row, so the heading and the description
                start on the same line, left and right. On wide screens the band
                sits low: the slide controls fill the space under the heading
                (reserved by its bottom padding), level with the buttons. */}
            <div className="container-page grid gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-12">
              <p className="eyebrow text-gold-bright lg:col-span-2">{slide.eyebrow}</p>
              <h1 className="font-serif text-2xl font-semibold leading-[1.15] tracking-tight text-balance sm:text-3xl lg:pb-[4.5rem] xl:text-[2.4rem]">
                {titleCase(slide.heading)}{" "}
                <span className="text-gold-bright">{titleCase(slide.accent)}</span>
              </h1>
              <div className="mt-1 lg:mt-0 lg:pt-1">
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
          {steps.map((item, stepIndex) => {
            const slide = heroSlides[item.slideIndex];
            const isActive = stepIndex === position % steps.length;
            const frames = phone ? phoneFrames(slide) : 1;

            return (
              <button
                key={`${slide.eyebrow}-${item.frame}`}
                type="button"
                onClick={() => setPosition(stepIndex)}
                aria-label={`Show slide ${stepIndex + 1}: ${slide.eyebrow}${frames > 1 ? ` (${item.frame + 1} of ${frames})` : ""}`}
                aria-current={isActive}
                className="group flex h-11 items-center"
              >
                <span
                  aria-hidden="true"
                  className={`block h-0.5 transition-all ${
                    isActive
                      ? "w-8 bg-gold sm:w-12"
                      : "w-5 bg-white/25 group-hover:bg-white/50 sm:w-8"
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

/**
 * The team photograph on a phone, in frames of three people: each frame is
 * a box with the proportions of its share of the row, full width at the top
 * of the hero, with the photograph positioned so only that share shows.
 * The frames cross-fade like the slides do.
 */
function PhoneFrames({ src, aspect, frames, active }: { src: string; aspect: string; frames: number; active: number }) {
  const [width, height] = aspect.split("/").map((part) => Number(part.trim()));
  const frameAspect = `${width / frames} / ${height}`;

  return (
    <div className="sm:hidden">
      {Array.from({ length: frames }, (_, frame) => (
        <div
          key={frame}
          className={`hero-slide absolute inset-x-0 top-0 ${frame === active ? "opacity-100" : "opacity-0"}`}
          style={{ aspectRatio: frameAspect }}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes={`${frames * 100}vw`}
            className="object-cover"
            style={{ objectPosition: `${(frame / (frames - 1)) * 100}% top` }}
            loading="eager"
            fetchPriority="low"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ink-mid to-transparent" />
        </div>
      ))}
    </div>
  );
}
