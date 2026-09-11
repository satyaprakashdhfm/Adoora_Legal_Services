/**
 * One landmark per office city, keyed by city name. Line drawings rather than
 * the solid glyphs `practice-icon.tsx` uses: these sit at the head of a
 * location card at 32px, where an outline reads as a building and a silhouette
 * reads as a blob. Each inherits its colour from the card it sits in.
 *
 * Hyderabad is the Charminar, Bengaluru the Vidhana Soudha, Guntur a temple
 * gopuram — the shorthand each city is drawn with locally.
 */
const cityIconPaths: Record<string, string[]> = {
  Hyderabad: [
    // Ground, then the two flanking minarets with their domes and finials.
    "M2.5 29h27",
    "M6 29V14m4 15V14",
    "M5.2 14h5.6",
    "M6.4 14a1.6 1.6 0 013.2 0",
    "M8 12.4V10",
    "M22 29V14m4 15V14",
    "M21.2 14h5.6",
    "M22.4 14a1.6 1.6 0 013.2 0",
    "M24 12.4V10",
    // The central block, its cornice and the arched opening beneath.
    "M10 29V17h12v12",
    "M9 17h14",
    "M10 21.5h12",
    "M13.5 29v-4.5a2.5 2.5 0 015 0V29",
  ],
  Bengaluru: [
    // Ground and plinth.
    "M2.5 29h27",
    "M5 29v-2.5h22V29",
    // The colonnaded front, with the entablature across it.
    "M7 26.5V17.5h18v9",
    "M6 17.5h20",
    "M11 26.5v-9m5 9v-9m5 9v-9",
    // Drum, dome and finial over the centre.
    "M13 17.5V15h6v2.5",
    "M13 15a3 3 0 016 0",
    "M16 11.6V9.2",
  ],
  Guntur: [
    // Ground, then the tower stepping back through three tiers.
    "M2.5 29h27",
    "M7.5 29v-6h17v6",
    "M9 23v-4h14v4",
    "M10.5 19v-3.5h11V19",
    // The barrel-vaulted cap and its finial.
    "M12 15.5h8",
    "M12 15.5a4 4 0 018 0",
    "M16 11.5V9",
    // Doorway.
    "M14 29v-3.5a2 2 0 014 0V29",
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
