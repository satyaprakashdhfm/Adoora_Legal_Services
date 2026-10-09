import Link from "next/link";
import { courtNumber, daysUntil, formatDate, hearingCountdown } from "@/lib/portal/format";

/*
 * The next hearing is the one date every portal user looks for first, so it
 * is the one place the portals use solid brand gold as a surface. Gold takes
 * `ink-deep` text to clear 4.5:1 (see the tokens in globals.css).
 */

function CalendarGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 2.75v3.5M13 2.75v3.5" />
    </svg>
  );
}

/** "14 / OCT": the date as a small gold tile, for lists of hearings. */
export function HearingDateChip({ date, tone = "gold" }: { date: string; tone?: "gold" | "soft" }) {
  const value = new Date(date);
  const day = value.toLocaleDateString("en-IN", { day: "numeric", timeZone: "UTC" });
  const month = value.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
  return (
    <span
      aria-hidden="true"
      className={`portal-label flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg leading-none ${
        tone === "gold" ? "bg-gold text-ink-deep" : "bg-gold/15 text-gold-deep ring-1 ring-gold/30"
      }`}
    >
      <span className="text-lg font-bold">{day}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{month}</span>
    </span>
  );
}

/** The case page's top-right block: the next date, how far off, and what it is for. */
export function NextHearingHighlight({ date, purpose }: { date: string; purpose: string | null }) {
  const days = daysUntil(date);
  const passed = days !== null && days < 0;

  if (passed) {
    return (
      <div className="w-full rounded-xl border border-line-strong bg-paper-tint px-5 py-4 sm:w-auto sm:min-w-64 sm:text-right">
        <p className="portal-label text-xs font-semibold uppercase tracking-wide text-slate">Last listed hearing</p>
        <p className="mt-1 font-serif text-xl font-semibold text-ink">{formatDate(date)}</p>
        <p className="mt-0.5 text-xs text-slate">
          Date has passed{purpose && ` · ${purpose}`}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-gold px-5 py-4 text-ink-deep shadow-[0_12px_28px_-14px_rgb(154_98_36/0.75)] ring-1 ring-gold-deep/30 sm:w-auto sm:min-w-64">
      <div className="flex items-center justify-between gap-4">
        <p className="portal-label inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <CalendarGlyph className="h-4 w-4" />
          Next hearing
        </p>
        <span className="portal-label rounded-full bg-ink-deep px-2.5 py-0.5 text-xs font-semibold text-gold-bright">
          {hearingCountdown(days)}
        </span>
      </div>
      <p className="mt-2 font-serif text-2xl font-semibold tracking-tight">{formatDate(date)}</p>
      {purpose && <p className="mt-0.5 text-sm font-medium text-ink-deep/80">{purpose}</p>}
    </div>
  );
}

type UpcomingCase = {
  id: string;
  reference: string;
  title: string;
  courtName: string | null;
  caseTypeCode: string | null;
  caseNumber: string | null;
  caseYear: number | null;
  nextHearingDate: string;
  nextHearingPurpose: string | null;
};

/**
 * The dashboard's top-right panel: the next few hearings across the user's
 * cases, soonest first. `hearings` must already be upcoming and sorted.
 */
export function UpcomingHearingsPanel({
  hearings,
  basePath,
  limit = 3,
}: {
  hearings: UpcomingCase[];
  basePath: string;
  limit?: number;
}) {
  const shown = hearings.slice(0, limit);
  const more = hearings.length - shown.length;

  return (
    <section aria-labelledby="next-hearings-heading" className="w-full overflow-hidden rounded-xl bg-ink text-white ring-1 ring-ink-mid">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h2 id="next-hearings-heading" className="portal-label inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold-bright">
          <CalendarGlyph className="h-4 w-4" />
          {shown.length > 1 ? "Next hearings" : "Next hearing"}
        </h2>
        {hearings.length > 0 && <span className="portal-label text-xs text-white/60">{hearings.length} listed</span>}
      </div>

      {shown.length === 0 ? (
        <p className="px-4 py-5 text-sm text-white/70">No upcoming hearings. A new date appears here as soon as it is recorded on a case.</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {shown.map((c, index) => {
            const days = daysUntil(c.nextHearingDate);
            return (
              <li key={c.id}>
                <Link href={`${basePath}/cases/${c.reference}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5">
                  <HearingDateChip date={c.nextHearingDate} tone={index === 0 ? "gold" : "soft"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{c.title}</p>
                    <p className="truncate text-xs text-white/65">
                      {[c.nextHearingPurpose, courtNumber(c), c.courtName].filter(Boolean).join(" · ") || formatDate(c.nextHearingDate)}
                    </p>
                  </div>
                  <span className={`portal-label shrink-0 text-xs font-semibold ${index === 0 ? "text-gold-bright" : "text-white/70"}`}>
                    {hearingCountdown(days)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {more > 0 && (
        <Link href={`${basePath}/cases`} className="block border-t border-white/10 px-4 py-2.5 text-xs font-semibold text-gold-bright hover:bg-white/5">
          {more} more in your cases →
        </Link>
      )}
    </section>
  );
}
