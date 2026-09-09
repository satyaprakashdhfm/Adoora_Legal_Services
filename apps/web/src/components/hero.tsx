"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Slide = {
  eyebrow: string;
  heading: string;
  body: string;
  href: string;
  cta: string;
};

/**
 * Hero slides. Each is framed around what the client is trying to achieve
 * rather than what the firm sells — and none of them make a claim about
 * outcomes, which the BCI rules would not permit.
 */
const slides: Slide[] = [
  {
    eyebrow: "Corporate & M&A",
    heading: "Transactions structured for the rules they have to survive",
    body: "Acquisitions, investments and joint ventures where the structuring question and the regulatory question cannot be separated — foreign investment routes, competition clearance and completion mechanics handled as one problem.",
    href: "/services/corporate-ma",
    cta: "Corporate & M&A",
  },
  {
    eyebrow: "Dispute Resolution",
    heading: "Strategy before pleadings, in the forum that fits the relief",
    body: "Commercial litigation and arbitration across the High Courts, tribunals and arbitral forums of Telangana, Andhra Pradesh and Karnataka — with a candid view on what a claim is worth after cost and time.",
    href: "/services/dispute-resolution",
    cta: "Dispute Resolution",
  },
  {
    eyebrow: "Banking & Finance",
    heading: "Security that holds at the point it matters — enforcement",
    body: "Rupee and foreign currency lending, external commercial borrowings and security documentation, with stamp duty, registration and perfection mapped for every state in which an asset sits.",
    href: "/services/banking-finance",
    cta: "Banking & Finance",
  },
];

const ROTATE_MS = 7000;

export function Hero() {
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
      () => setIndex((current) => (current + 1) % slides.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const active = slides[index];

  return (
    <section
      className="relative overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Firm practice highlights"
    >
      {/* Decorative ground. Replace with commissioned photography when the
          firm supplies it — the layout expects a 16:9-ish dark image. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-gold-bright/10 blur-[130px]" />
        <div className="absolute right-[-10rem] bottom-[-14rem] h-[30rem] w-[38rem] rounded-full bg-white/[0.04] blur-[120px]" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="hero-grid"
              width="56"
              height="56"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M56 0H0v56"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          {/* Slides are stacked so the container height does not jump between
              headings of different lengths. */}
          <div className="grid">
            {slides.map((slide, slideIndex) => {
              const isActive = slideIndex === index;

              return (
                <div
                  key={slide.eyebrow}
                  className={`hero-slide col-start-1 row-start-1 ${
                    isActive
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                  aria-hidden={!isActive}
                >
                  <p className="eyebrow inline-flex items-center gap-2.5 text-gold-bright">
                    <span className="h-px w-8 bg-gold-bright/60" />
                    {slide.eyebrow}
                  </p>

                  <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
                    {slide.heading}
                  </h1>

                  <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
                    {slide.body}
                  </p>

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={slide.href}
                      className="rounded-full bg-gold-bright px-7 py-3.5 text-center text-sm font-semibold text-ink transition hover:bg-white"
                    >
                      {slide.cta}
                    </Link>
                    <Link
                      href="/contact"
                      className="rounded-full border border-white/25 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:border-white/60"
                    >
                      Request information
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Slide controls */}
          <div className="mt-12 flex items-center gap-3">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.eyebrow}
                type="button"
                onClick={() => setIndex(slideIndex)}
                aria-label={`Show slide ${slideIndex + 1}: ${slide.eyebrow}`}
                aria-current={slideIndex === index}
                className={`h-1 rounded-full transition-all ${
                  slideIndex === index
                    ? "w-12 bg-gold-bright"
                    : "w-6 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
            <span className="sr-only" aria-live="polite">
              {active.eyebrow}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
