"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { firm } from "@/content/firm";

type Slide = {
  eyebrow: string;
  /** The heading is split so the closing phrase can carry the gold accent. */
  heading: string;
  accent: string;
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
    heading: "Transactions structured for the rules they have",
    accent: "to survive",
    body: "Acquisitions, investments and joint ventures where the structuring question and the regulatory question cannot be separated — foreign investment routes, competition clearance and completion mechanics handled as one problem.",
    href: "/services/corporate-ma",
    cta: "Corporate & M&A",
  },
  {
    eyebrow: "Dispute Resolution",
    heading: "Strategy before pleadings, in the forum that",
    accent: "fits the relief",
    body: "Commercial litigation and arbitration across the High Courts, tribunals and arbitral forums of Telangana, Andhra Pradesh and Karnataka — with a candid view on what a claim is worth after cost and time.",
    href: "/services/dispute-resolution",
    cta: "Dispute Resolution",
  },
  {
    eyebrow: "Banking & Finance",
    heading: "Security that holds at the point it matters —",
    accent: "enforcement",
    body: "Rupee and foreign currency lending, external commercial borrowings and security documentation, with stamp duty, registration and perfection mapped for every state in which an asset sits.",
    href: "/services/banking-finance",
    cta: "Banking & Finance",
  },
];

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
      className="relative isolate overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Firm practice highlights"
    >
      {/* Photography sits to the right; the navy wash keeps the left-hand
          column readable at every width. If the file is absent the gradient
          alone still carries the band. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src="/hero-law-justice.png"
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover object-right"
        />
        <div className="absolute inset-0 bg-linear-to-r from-ink via-ink/90 to-ink/40" />
        <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-transparent to-ink/40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl">
          {/* Slides are stacked so the container height does not jump between
              headings of different lengths. */}
          <div className="grid">
            {slides.map((slide, slideIndex) => {
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

                  <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.14] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
                    {slide.heading}{" "}
                    <span className="text-gold-bright">{slide.accent}</span>
                  </h1>

                  <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                    {slide.body}
                  </p>

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={slide.href}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
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

          {/* Numbered slide controls, each with a rule that fills when active. */}
          <div className="mt-14 flex items-center gap-8">
            {slides.map((slide, slideIndex) => {
              const isActive = slideIndex === index;

              return (
                <button
                  key={slide.eyebrow}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  aria-label={`Show slide ${slideIndex + 1}: ${slide.eyebrow}`}
                  aria-current={isActive}
                  className="group flex flex-col gap-2"
                >
                  <span
                    aria-hidden="true"
                    className={`h-0.5 w-9 transition-colors ${
                      isActive ? "bg-gold" : "bg-white/25 group-hover:bg-white/50"
                    }`}
                  />
                  <span
                    className={`text-xs font-semibold tabular-nums transition-colors ${
                      isActive ? "text-white" : "text-white/45"
                    }`}
                  >
                    {String(slideIndex + 1).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
            <span className="sr-only" aria-live="polite">
              {active.eyebrow}
            </span>
          </div>
        </div>

        {/* Standing line from the firm's own collateral. */}
        <p className="mt-14 max-w-[13rem] font-serif text-sm italic leading-relaxed text-white/60 lg:absolute lg:bottom-14 lg:right-6 lg:mt-0 lg:text-right">
          &ldquo;{firm.heroQuote}&rdquo;
        </p>
      </div>
    </section>
  );
}
