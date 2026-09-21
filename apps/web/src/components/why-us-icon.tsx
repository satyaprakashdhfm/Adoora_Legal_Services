/**
 * The five icons on the "Why partner with us" hub-and-spoke diagram, in the
 * same order as `differentiators` in `content/firm.ts`. Line drawings rather
 * than solid glyphs, matching `city-icon.tsx` — they sit inside a small ring
 * where a solid shape would read as a blob.
 */
const whyUsIconPaths: Record<number, { circles?: [number, number, number][]; paths: string[] }> = {
  // Proven Legal Expertise — a single figure.
  0: {
    circles: [[12, 8.5, 3.3]],
    paths: ["M5 20.5c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"],
  },
  // Client-First Approach — two figures, side by side.
  1: {
    circles: [
      [8.5, 8, 2.6],
      [15.5, 8, 2.6],
    ],
    paths: [
      "M3 20c0-3.3 2.5-5.4 5.5-5.4S14 16.7 14 20",
      "M10 20c0-3.3 2.5-5.4 5.5-5.4S21 16.7 21 20",
    ],
  },
  // Connected Client Experience — a message bubble.
  2: {
    paths: [
      "M4 5.5h16a1 1 0 011 1v9a1 1 0 01-1 1H9.5L5 20.5V16.5H4a1 1 0 01-1-1v-9a1 1 0 011-1z",
      "M7.5 10.5h9M7.5 13.5h5.5",
    ],
  },
  // Cross-Border & Regulatory Mastery — a globe.
  3: {
    circles: [[12, 12, 8.5]],
    paths: [
      "M3.5 12h17",
      "M12 3.5c2.8 2.3 4.3 5.3 4.3 8.5s-1.5 6.2-4.3 8.5c-2.8-2.3-4.3-5.3-4.3-8.5S9.2 5.8 12 3.5z",
    ],
  },
  // Strategic Legal Solutions — an ascending bar chart.
  4: {
    paths: ["M4.5 20V12.5", "M10.5 20V9", "M16.5 20V5.5", "M3 20.5h18"],
  },
};

export function WhyUsIcon({
  index,
  className = "h-6 w-6",
}: {
  index: number;
  className?: string;
}) {
  const icon = whyUsIconPaths[index];
  if (!icon) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icon.circles?.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} />
      ))}
      {icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
