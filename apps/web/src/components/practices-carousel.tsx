"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type SVGProps } from "react";
import type { PracticeArea } from "@/content/types";

/**
 * The home page's practice teaser — a horizontally scrolling row of cards,
 * each carrying a number, a name and an abstract line-art motif rather than
 * a photograph. No practice photography exists yet, so the motifs stand in
 * for it rather than leaving the cards bare; they cycle through a small set
 * rather than needing one drawn per practice.
 *
 * Alternative Dispute Resolution is labelled by its full name rather than
 * `shortName` ("ADR") — the card is wide enough, and the abbreviation reads
 * as jargon on first visit.
 */

const motifs = [
  // Nested arcs, bottom-left.
  function ArcsMotif(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
        <circle cx="0" cy="140" r="30" />
        <circle cx="0" cy="140" r="56" />
        <circle cx="0" cy="140" r="82" />
      </svg>
    );
  },
  // Fanned vertical bars.
  function BarsMotif(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
        <rect x="60" y="20" width="14" height="110" rx="3" transform="rotate(-6 67 75)" />
        <rect x="78" y="15" width="14" height="115" rx="3" transform="rotate(-2 85 72)" />
        <rect x="96" y="20" width="14" height="110" rx="3" transform="rotate(3 103 75)" />
        <rect x="114" y="25" width="14" height="105" rx="3" transform="rotate(7 121 77)" />
      </svg>
    );
  },
  // Overlapping circles.
  function VennMotif(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
        <circle cx="50" cy="90" r="35" />
        <circle cx="90" cy="90" r="35" />
        <circle cx="70" cy="55" r="35" />
      </svg>
    );
  },
  // Ascending diagonal lines with a node.
  function AscentMotif(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
        <line x1="15" y1="130" x2="120" y2="30" />
        <line x1="40" y1="130" x2="120" y2="58" />
        <circle cx="95" cy="55" r="6" fill="currentColor" stroke="none" />
      </svg>
    );
  },
  // Layered facets.
  function FacetsMotif(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
        <polygon points="35,130 88,15 88,130" />
        <polygon points="88,130 132,48 132,130" />
      </svg>
    );
  },
  // Ascending bar chart.
  function ChartMotif(props: SVGProps<SVGSVGElement>) {
    return (
      <svg viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth={1.4} {...props}>
        <rect x="28" y="88" width="16" height="42" />
        <rect x="58" y="62" width="16" height="68" />
        <rect x="88" y="38" width="16" height="92" />
        <rect x="118" y="18" width="16" height="112" />
      </svg>
    );
  },
];

function Card({ item, index }: { item: PracticeArea; index: number }) {
  const Motif = motifs[index % motifs.length];
  const label = item.slug === "dispute-resolution" ? item.name : item.shortName;

  return (
    <li className="w-[13.5rem] shrink-0 snap-start">
      <Link
        href={`/services/${item.slug}`}
        className="group relative flex h-72 flex-col overflow-hidden rounded-2xl border border-line bg-paper p-5 transition hover:border-gold hover:shadow-lg hover:shadow-ink/5"
      >
        <span className="font-serif text-sm font-semibold text-gold-deep">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span aria-hidden="true" className="mt-2 h-px w-6 bg-line-strong" />
        <h3 className="relative z-10 mt-4 font-serif text-lg font-semibold leading-snug tracking-tight text-ink">
          {label}
        </h3>

        <Motif
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-5 -right-5 h-32 w-32 text-gold/25 transition group-hover:text-gold/45"
        />

        <span className="relative z-10 mt-auto flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-ink transition group-hover:border-gold group-hover:bg-gold group-hover:text-white">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
            <path
              d="M2 8h11M9 4l4 4-4 4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </Link>
    </li>
  );
}

export function PracticesCarousel({ items }: { items: readonly PracticeArea[] }) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [stops, setStops] = useState<number[]>([0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const step = card.getBoundingClientRect().width + 20; // card width + gap
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  /*
   * The dots mark the scroll positions the row can actually reach, not the
   * cards. Once the row is scrolled to its end, the last few cards are all
   * in view but none of them can reach the left edge, so a dot per card
   * would never light the final few. One stop per card that can reach the
   * edge, plus the very end of the row. Recomputed on resize, since how many
   * cards fit on screen changes with the width.
   */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function measure() {
      const max = el!.scrollWidth - el!.clientWidth;
      const containerLeft = el!.getBoundingClientRect().left - el!.scrollLeft;
      const offsets = Array.from(el!.querySelectorAll("li")).map(
        (card) => card.getBoundingClientRect().left - containerLeft,
      );
      const next = offsets.filter((offset) => offset < max - 2);
      next.push(max);
      setStops(next.length > 0 ? next : [0]);
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onScroll() {
      let closest = 0;
      stops.forEach((stop, i) => {
        if (Math.abs(stop - el!.scrollLeft) < Math.abs(stops[closest] - el!.scrollLeft)) {
          closest = i;
        }
      });
      setActiveIndex(closest);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [stops]);

  /*
   * Auto-scroll: one card every 3s, back to the start after the end. Paused
   * while the cursor or keyboard focus is on the row, or a finger is on it;
   * the timer restarts from each new position, so a manual scroll or arrow
   * click gets a full interval before the row moves again. Off for readers
   * who ask for reduced motion.
   */
  useEffect(() => {
    if (paused || stops.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      const el = scrollerRef.current;
      if (!el) return;
      if (activeIndex >= stops.length - 1) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCard(1);
      }
    }, 3000);
    return () => window.clearTimeout(id);
  }, [activeIndex, paused, stops.length]);

  function goTo(index: number) {
    scrollerRef.current?.scrollTo({ left: stops[index], behavior: "smooth" });
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Scroll to previous practices"
        className="absolute -left-4 top-28 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-paper text-ink shadow-sm transition hover:border-gold hover:text-gold-deep sm:flex"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
          <path
            d="M14 8H3M7 4L3 8l4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <ul
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <Card key={item.slug} item={item} index={index} />
        ))}
      </ul>

      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Scroll to next practices"
        className="absolute -right-4 top-28 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-paper text-ink shadow-sm transition hover:border-gold hover:text-gold-deep sm:flex"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
          <path
            d="M2 8h11M9 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="mt-6 flex justify-center gap-1.5">
        {stops.map((stop, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Scroll to position ${index + 1} of ${stops.length}`}
            aria-current={index === activeIndex}
            className="flex h-4 items-center"
          >
            <span
              className={`block h-1 rounded-full transition-all ${
                index === activeIndex ? "w-6 bg-gold" : "w-1.5 bg-line-strong"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
