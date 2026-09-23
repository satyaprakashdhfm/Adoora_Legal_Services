import Image from "next/image";
import { publicImage } from "@/lib/public-image";

/**
 * One building per office, keyed by city name — the High Court of the state
 * that office sits in, drawn as supplied artwork (`court-<state>.png`,
 * gold line work on a transparent ground) rather than the hand-drawn SVGs
 * this used to carry.
 *
 * The files are cropped from one sheet, so they share a baseline and a
 * canvas: render them at a common height and the three sit level with each
 * other, at the relative sizes the artwork intends.
 */
const courtByCity: Record<string, string> = {
  Hyderabad: "court-telangana",
  Bengaluru: "court-karnataka",
  Guntur: "court-andhra-pradesh",
};

export function CityIcon({
  city,
  className = "h-10 w-auto",
}: {
  city: string;
  className?: string;
}) {
  const base = courtByCity[city];
  const src = base ? publicImage(base) : null;
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      width={180}
      height={124}
      className={className}
    />
  );
}
