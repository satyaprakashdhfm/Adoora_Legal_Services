/**
 * One icon per practice area, keyed by slug. Solid 24×24 glyphs drawn as a
 * single path each, with counters (windows, doors, rules) knocked out by the
 * even-odd fill rule — no icon font, and each inherits its colour from the
 * card it sits in.
 *
 * Shared by the home-page practice grid and the /services listing so the two
 * cannot drift apart.
 */
const practiceIconPath: Record<string, string> = {
  // Office block with windows and a doorway.
  "corporate-ma":
    "M6 2h12v20h-4.5v-4h-3v4H6V2zm2.5 3v2.5h2.5V5H8.5zm4.5 0v2.5h2.5V5H13zm-4.5 4.5V12h2.5V9.5H8.5zm4.5 0V12h2.5V9.5H13zm-4.5 4.5v2.5h2.5V14H8.5zm4.5 0v2.5h2.5V14H13z",
  // Ascending bar chart.
  "banking-finance": "M4 13.5h4V21H4v-7.5zM10 8.5h4V21h-4V8.5zM16 3.5h4V21h-4V3.5z",
  // Three figures — the parties to a dispute.
  "dispute-resolution":
    "M12 3.6a3.2 3.2 0 110 6.4 3.2 3.2 0 010-6.4zM5.9 5.9a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zM18.1 5.9a2.6 2.6 0 110 5.2 2.6 2.6 0 010-5.2zM12 11.4c3 0 5.4 2 5.4 4.4V20H6.6v-4.2c0-2.4 2.4-4.4 5.4-4.4zM5.4 12.6c.6 0 1.2.1 1.7.3a6.4 6.4 0 00-1.8 3.9V20H1v-2.9c0-2.1 2-4.5 4.4-4.5zM18.6 12.6c2.4 0 4.4 2.4 4.4 4.5V20h-4.3v-3.2a6.4 6.4 0 00-1.8-3.9c.5-.2 1.1-.3 1.7-.3z",
  // House with a doorway.
  "real-estate-infrastructure": "M12 3L2 11.5h3V21h5v-6h4v6h5v-9.5h3L12 3z",
  // Page with a folded corner and ruled lines.
  taxation:
    "M6 2h7.5L19 7.5V22H6V2zm7.5 0L19 7.5h-5.5V2zM8.5 11.5h8V13h-8v-1.5zm0 3.5h8v1.5h-8V15zm0 3.5h5V20h-5v-1.5z",
  // Two figures — the employment relationship.
  "labour-employment":
    "M9.2 2.8a3.8 3.8 0 110 7.6 3.8 3.8 0 010-7.6zM9.2 12.1c3.9 0 7 2.4 7 5.3V21H2.2v-3.6c0-2.9 3.1-5.3 7-5.3zM17.4 4.6a3 3 0 110 6 3 3 0 010-6zM17.6 12.2c2.8 0 5.2 1.9 5.2 4.1V21h-4.6v-3.6c0-1.9-.8-3.6-2.2-4.9.5-.2 1-.3 1.6-.3z",
  // Shield — the consent perimeter a regulator grants and can withdraw.
  "regulatory-environmental":
    "M12 2l8.5 3.4v5.3c0 5.3-3.6 9.7-8.5 11.3-4.9-1.6-8.5-6-8.5-11.3V5.4L12 2zm0 4.6a4.4 4.4 0 100 8.8 4.4 4.4 0 000-8.8zm0 2a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8z",
  // Filament bulb — an idea, protected.
  "intellectual-property":
    "M12 2a7.2 7.2 0 00-4.3 12.9c.7.5 1.1 1.3 1.1 2.1v.5h6.4V17c0-.8.4-1.6 1.1-2.1A7.2 7.2 0 0012 2zM8.8 19.1h6.4v.6a2.3 2.3 0 01-2.3 2.3h-1.8a2.3 2.3 0 01-2.3-2.3v-.6z",
};

export function PracticeIcon({
  slug,
  className = "h-7 w-7",
}: {
  slug: string;
  className?: string;
}) {
  const path = practiceIconPath[slug];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={path} />
    </svg>
  );
}
