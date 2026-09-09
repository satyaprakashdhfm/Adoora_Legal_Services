import Link from "next/link";
import { firm } from "@/content/firm";

/** The scales mark carried over from the holding page. */
export function ScalesMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 7v18M10 25h12M7 11h18M7 11l-3 7h6zM25 11l-3 7h6z" />
      <circle cx="16" cy="6" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Wordmark. `tone` switches it for use on dark bands (the footer and the
 * hero) without duplicating the markup.
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
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition ${
          isDark
            ? "border-white/20 bg-white/5 text-gold-bright"
            : "border-line-strong bg-paper-warm text-gold"
        }`}
      >
        <ScalesMark className="h-6 w-6" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif text-lg font-semibold tracking-tight ${
            isDark ? "text-white" : "text-ink"
          }`}
        >
          {firm.shortName}
        </span>
        <span
          className={`mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${
            isDark ? "text-white/55" : "text-slate-light"
          }`}
        >
          Legal Services
        </span>
      </span>
    </Link>
  );
}
