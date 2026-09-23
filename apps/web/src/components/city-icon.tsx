import Image from "next/image";
import { publicImage } from "@/lib/public-image";

/**
 * One building per office, keyed by city name — the High Court of the state
 * that office sits in, drawn as supplied artwork (`hc-<state>.png`, in
 * the site gold on a transparent ground).
 *
 * The three buildings are very different shapes — the Karnataka façade is
 * nearly three times as wide as it is tall, the Telangana one under twice —
 * so they are not sized by a shared canvas. Each is fitted (`contain`) into
 * a box as wide as its card and a fixed height, centred across the card and
 * anchored to the bottom, so a wide one is limited by the card's width, a
 * tall one by the height, and all three keep their ground lines level.
 *
 * The files are the exact site gold (`--color-gold`, checked pixel for pixel,
 * and unchanged by the image optimizer), but they read heavier than the same
 * gold on the thin strokes of the icons elsewhere on the site: a large solid
 * fill shows the colour at full strength where a hairline anti-aliases into a
 * lighter tan. `opacity-80` brings the rendered tone in line with those
 * icons (about 205,148,92 on the paper ground) without touching the files.
 */
const courtByCity: Record<string, string> = {
  Hyderabad: "hc-telangana",
  Bengaluru: "hc-karnataka",
  Guntur: "hc-andhra-pradesh",
};

export function CityIcon({
  city,
  className = "h-20 w-full",
}: {
  city: string;
  className?: string;
}) {
  const base = courtByCity[city];
  const src = base ? publicImage(base) : null;
  if (!src) return null;

  return (
    <span className={`relative block ${className}`}>
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 1024px) 14rem, (min-width: 640px) 30vw, 90vw"
        className="object-contain object-bottom opacity-80"
      />
    </span>
  );
}
