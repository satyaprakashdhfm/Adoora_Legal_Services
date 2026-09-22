/**
 * One building per office, keyed by city name — the High Court of the state
 * that office sits in, not a generic city landmark. Line drawings rather
 * than the solid glyphs `practice-icon.tsx` uses: these sit at the head of a
 * location card at 32px, where an outline reads as a building and a
 * silhouette reads as a blob. Each inherits its colour from the card it
 * sits in.
 *
 * Hyderabad → High Court of Telangana (triple-domed, Indo-Saracenic).
 * Bengaluru → High Court of Karnataka (pedimented, colonnaded, no dome —
 * the point of difference from the domed Vidhana Soudha this used to draw).
 * Guntur → High Court of Andhra Pradesh (single large dome, corner minarets).
 */
const cityIconPaths: Record<string, string[]> = {
  Hyderabad: [
    // Ground, base platform and the main facade with its cornice.
    "M2.5 29h27",
    "M5 29v-2h22v2",
    "M7.5 27V15h17v12",
    "M6.5 15h20",
    // Arched entrance and flanking windows.
    "M14.5 27v-5.5a1.5 1.5 0 013 0V27",
    "M10 18v6M22 18v6",
    // Central dome, on its drum, with a finial.
    "M13 15v-1.8h6V15",
    "M13 13.2a3 3 0 016 0",
    "M16 10.2V8.2",
    // The two smaller flanking domes.
    "M8.5 15v-1.3h3V15",
    "M8.5 13.7a1.5 1.5 0 013 0",
    "M20.5 15v-1.3h3V15",
    "M20.5 13.7a1.5 1.5 0 013 0",
  ],
  Bengaluru: [
    // Ground and the steps up to the portico.
    "M2.5 29h27",
    "M5 29v-1.6h22V29",
    // Columns and the entablature they carry.
    "M10 27.4V15.9M13 27.4V15.9M16 27.4V15.9M19 27.4V15.9M22 27.4V15.9",
    "M8 16.5h16",
    // The pediment, with a finial at each end.
    "M16 8.5l7.5 6h-15l7.5-6z",
    "M9 14.2v-2.6M23 14.2v-2.6",
  ],
  Guntur: [
    // Ground, base platform and the main facade with its cornice.
    "M2.5 29h27",
    "M5 29v-2h22v2",
    "M7.5 27V16h17v11",
    "M6.5 16h20",
    // Arched entrance.
    "M14.5 27v-6a1.5 1.5 0 013 0v6",
    // The single large dome, on its drum, with a finial.
    "M12.5 16v-1.8h7V16",
    "M12.5 14.2a3.5 3.5 0 017 0",
    "M16 10.7V8.7",
    // Corner minarets, each with a pointed tip.
    "M8 16v-5",
    "M7 11l1-2 1 2",
    "M24 16v-5",
    "M23 11l1-2 1 2",
  ],
};

export function CityIcon({
  city,
  className = "h-8 w-8",
}: {
  city: string;
  className?: string;
}) {
  const paths = cityIconPaths[city];
  if (!paths) return null;

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
