"use client";

import { useEffect, useRef, useState } from "react";
import { currentArea } from "@/lib/portal/api";

/**
 * "Add to calendar" for a case's next hearing, on the gold card at the top
 * of the case page. Two ways in:
 *
 * - Google Calendar: its own "new event" page, filled in, in a new tab.
 * - Calendar app: the API's .ics file for the hearing. Served from a real URL
 *   (not built in the browser) because iPhones and Macs only hand a calendar
 *   file to the Calendar app when it arrives from one; Outlook and Android
 *   calendars open it the same way.
 *
 * Hearings have a date but no time, so both are all-day events.
 */

export type HearingForCalendar = {
  reference: string;
  title: string;
  date: string;
  purpose: string | null;
  location: string | null;
  number: string | null;
};

const compact = (date: string) => date.slice(0, 10).replace(/-/g, "");

function nextDay(date: string): string {
  const day = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

function googleUrl(hearing: HearingForCalendar): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Hearing: ${hearing.title}`,
    dates: `${compact(hearing.date)}/${compact(nextDay(hearing.date))}`,
    details: [
      hearing.purpose ? `Listed for: ${hearing.purpose}` : null,
      hearing.number,
      `Case reference: ${hearing.reference}`,
      "ADOORA Legal Services",
    ]
      .filter(Boolean)
      .join("\n"),
  });
  if (hearing.location) params.set("location", hearing.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** A plain link carries no area header, so the area rides in the query. */
const icsUrl = (reference: string) => `/api/cases/${encodeURIComponent(reference)}/next-hearing.ics?area=${currentArea()}`;

export function AddToCalendar({ hearing }: { hearing: HearingForCalendar }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-ink transition hover:bg-paper-warm";

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="portal-label inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink-deep px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-ink-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-deep/40 sm:w-auto"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 text-gold-bright" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
          <path d="M3 8.5h14M7 2.75v3.5M13 2.75v3.5M10 10.5v4M8 12.5h4" />
        </svg>
        Add to calendar
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-line bg-white py-1 text-ink shadow-xl">
          <a role="menuitem" href={googleUrl(hearing)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={item}>
            Google Calendar
          </a>
          <a role="menuitem" href={icsUrl(hearing.reference)} onClick={() => setOpen(false)} className={item}>
            Calendar app
            <span className="ml-auto text-xs font-normal text-slate">Apple, Outlook</span>
          </a>
        </div>
      )}
    </div>
  );
}
