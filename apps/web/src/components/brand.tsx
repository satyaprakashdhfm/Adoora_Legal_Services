import Image from "next/image";
import Link from "next/link";
import { firm } from "@/content/firm";

/**
 * The firm's mark: the triangular "A" carrying an advocate's bands inside a
 * laurel wreath. Sourced from the artwork in `/resources` and flattened to a
 * single gold silhouette, so the cut-outs pick up whatever sits behind them —
 * off-white on the light ground, navy on the dark bands, exactly as the
 * letterhead and visiting cards use it.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/adoora-mark.png"
      alt=""
      aria-hidden="true"
      width={640}
      height={611}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Full lockup: mark, "ADOORA" in the display serif, a gold rule, and the
 * letterspaced descriptor beneath. `tone` switches it for the navy bands
 * (the footer, the mobile drawer) without duplicating the markup.
 */
export function Wordmark({
  tone = "light",
  className = "",
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const isDark = tone === "dark";

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label={`${firm.name} — home`}
    >
      <BrandMark className="h-10 w-auto shrink-0 transition group-hover:opacity-90" />

      <span className="flex flex-col leading-none">
        <span
          className={`font-serif text-xl font-semibold uppercase tracking-[0.08em] ${
            isDark ? "text-white" : "text-ink"
          }`}
        >
          {firm.shortName}
        </span>
        <span
          aria-hidden="true"
          className="mt-1.5 h-px w-full bg-gold"
        />
        <span
          className={`mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.24em] ${
            isDark ? "text-white/65" : "text-slate"
          }`}
        >
          Legal Services
        </span>
      </span>
    </Link>
  );
}
