/**
 * Generated artwork for the insight cards.
 *
 * The firm has no photography for the insights, and stock imagery for legal
 * explainers is uniformly bad — gavels, handshakes, a hand holding a floating
 * blue hologram. These are drawn instead: a navy ground in the brand gradient
 * with the subject sketched over it in gold line work, one composition per
 * article, so a reader can tell three cards apart at a glance without the page
 * claiming to show something it does not.
 *
 * An article that later gets a real photograph sets `image` in `insights.ts`
 * and the card uses that instead — see `public/README.md`.
 */

export type ArtworkKey =
  | "network"
  | "parcels"
  | "boundary"
  | "datamap"
  | "interim"
  | "threshold";

/** Shared ground: the navy gradient every card sits on. */
function Ground({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-ink-mid)" />
          <stop offset="100%" stopColor="var(--color-ink-deep)" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${id})`} />
      {/* A faint gold bloom off the top-right, as the dark bands carry. */}
      <circle cx="360" cy="20" r="120" fill="var(--color-gold)" opacity="0.07" />
    </>
  );
}

/**
 * Each scene is stroked gold on the navy. Kept to straight lines, circles and
 * arcs so they hold up at card width and read as one family.
 */
const scenes: Record<ArtworkKey, React.ReactNode> = {
  // Lending rails: a regulated entity at the centre, service providers around
  // it, money moving along the spokes.
  network: (
    <g>
      <g stroke="var(--color-gold)" strokeWidth="1.1" opacity="0.55" fill="none">
        <path d="M200 120 L92 66M200 120 L312 62M200 120 L78 168M200 120 L322 176M200 120 L196 46M200 120 L204 200" />
      </g>
      <g fill="var(--color-gold)">
        <circle cx="92" cy="66" r="4" />
        <circle cx="312" cy="62" r="4" />
        <circle cx="78" cy="168" r="4" />
        <circle cx="322" cy="176" r="4" />
        <circle cx="196" cy="46" r="4" />
        <circle cx="204" cy="200" r="4" />
      </g>
      <circle cx="200" cy="120" r="26" fill="none" stroke="var(--color-gold)" strokeWidth="1.8" />
      <circle cx="200" cy="120" r="7" fill="var(--color-gold)" />
      <circle cx="200" cy="120" r="44" fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.3" />
    </g>
  ),

  // Title investigation: survey parcels overlaid on a cadastral grid, one
  // parcel picked out — the plot whose chain is being traced.
  parcels: (
    <g fill="none" stroke="var(--color-gold)">
      <g strokeWidth="0.8" opacity="0.22">
        <path d="M40 40h320M40 80h320M40 120h320M40 160h320M40 200h320" />
        <path d="M80 30v180M120 30v180M160 30v180M200 30v180M240 30v180M280 30v180M320 30v180" />
      </g>
      <path strokeWidth="1.3" opacity="0.6" d="M60 62h110v56H60zM214 54h120v70H214zM96 148h96v58H96z" />
      <path strokeWidth="2" d="M214 148h124v62H214z" />
      <path strokeWidth="2" d="M214 148 338 210M338 148 214 210" opacity="0.35" />
      <circle cx="276" cy="179" r="9" strokeWidth="1.6" />
    </g>
  ),

  // Non-compete: two spheres of activity and the line a court will actually
  // hold — the covenant bites on one side of it only.
  boundary: (
    <g fill="none">
      <circle cx="140" cy="120" r="66" stroke="var(--color-gold)" strokeWidth="1.4" opacity="0.5" />
      <circle cx="262" cy="120" r="66" stroke="var(--color-gold)" strokeWidth="1.4" opacity="0.5" />
      <path d="M201 120m-30 0a30 42 0 0060 0a30 42 0 00-60 0" stroke="var(--color-gold)" strokeWidth="2" />
      <path d="M201 34v172" stroke="var(--color-gold)" strokeWidth="1.6" strokeDasharray="7 7" opacity="0.8" />
      <circle cx="140" cy="120" r="4" fill="var(--color-gold)" />
      <circle cx="262" cy="120" r="4" fill="var(--color-gold)" />
    </g>
  ),

  // DPDP: the data map — where personal data enters, where it rests, and the
  // one flow that leaves the perimeter.
  datamap: (
    <g fill="none" stroke="var(--color-gold)">
      <g strokeWidth="1.4" opacity="0.75">
        <rect x="52" y="58" width="70" height="40" rx="4" />
        <rect x="52" y="142" width="70" height="40" rx="4" />
        <rect x="165" y="100" width="70" height="40" rx="4" />
        <rect x="278" y="58" width="70" height="40" rx="4" />
        <rect x="278" y="142" width="70" height="40" rx="4" />
      </g>
      <g strokeWidth="1.1" opacity="0.5">
        <path d="M122 78h26v42h17M122 162h26v-42h17M235 120h26v-42h17M235 120h26v42h17" />
      </g>
      <ellipse cx="200" cy="120" rx="152" ry="96" strokeWidth="1.2" strokeDasharray="6 8" opacity="0.4" />
      <g fill="var(--color-gold)" stroke="none">
        <circle cx="200" cy="120" r="5" />
        <circle cx="313" cy="78" r="3.5" />
        <circle cx="313" cy="162" r="3.5" />
      </g>
    </g>
  ),

  // Section 9: relief sought on the clock, before the tribunal exists — the
  // solid stretch is what the applicant is trying to cover.
  interim: (
    <g fill="none" stroke="var(--color-gold)">
      <circle cx="200" cy="112" r="54" strokeWidth="1.8" />
      <path d="M200 112V74M200 112l28 18" strokeWidth="2" strokeLinecap="round" />
      <g strokeWidth="1.4" opacity="0.55">
        <path d="M200 58v-8M254 112h8M200 166v8M146 112h-8" />
      </g>
      <path d="M52 200h296" strokeWidth="1.2" opacity="0.4" />
      <path d="M52 200h118" strokeWidth="3" strokeLinecap="round" />
      <g fill="var(--color-gold)" stroke="none">
        <circle cx="52" cy="200" r="4" />
        <circle cx="170" cy="200" r="4" />
        <circle cx="348" cy="200" r="4" />
      </g>
    </g>
  ),

  // Deal value threshold: two parties combining, and the line above which the
  // combination has to be notified.
  threshold: (
    <g fill="none" stroke="var(--color-gold)">
      <circle cx="152" cy="140" r="52" strokeWidth="1.5" opacity="0.6" />
      <circle cx="248" cy="140" r="52" strokeWidth="1.5" opacity="0.6" />
      <path d="M40 76h320" strokeWidth="2" strokeDasharray="10 6" />
      <path d="M200 188V96" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M188 110l12-14 12 14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="var(--color-gold)" stroke="none">
        <circle cx="200" cy="140" r="5" />
        <rect x="46" y="62" width="26" height="3" rx="1.5" />
      </g>
    </g>
  ),
};

export function InsightArtwork({
  artwork,
  className = "",
}: {
  artwork: ArtworkKey;
  className?: string;
}) {
  /* The gradient id has to be unique per scene, or two cards on one page
     share the first one's fill. */
  const gradientId = `insight-ground-${artwork}`;

  return (
    <svg
      viewBox="0 0 400 240"
      role="presentation"
      aria-hidden="true"
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <Ground id={gradientId} />
      {scenes[artwork]}
    </svg>
  );
}
