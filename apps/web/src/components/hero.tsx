"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

  return (
    <section
      className="relative isolate overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
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
              {slide.bright && <div className="absolute inset-0 bg-ink/25" />}
            </div>
          );
        })}

        <div className="absolute inset-0 bg-linear-to-r from-ink from-30% via-ink/60 via-70% to-ink/5" />
        <div className="absolute inset-0 bg-linear-to-t from-ink/60 via-transparent to-ink/20" />
      </div>

      <div className="container-page relative flex flex-col justify-center py-16 sm:py-20 lg:min-h-[calc(100svh-7.5rem)] lg:py-16">
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
                  className="group py-2"
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
    </section>
  );
}
