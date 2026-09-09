import Link from "next/link";
import type { Metadata } from "next";
import { ScalesMark } from "@/components/brand";
import { declineNotice } from "@/content/legal";
import { firm } from "@/content/firm";

export const metadata: Metadata = {
  title: "Notice",
  description:
    "Information about the firm is not displayed because the disclaimer was not accepted.",
  robots: { index: false, follow: false },
};

/**
 * Shown when a visitor selects "I DO NOT AGREE" on the disclaimer gate.
 *
 * Deliberately carries no firm information — no practice areas, no people, no
 * recognitions, no navigation into the site. `SiteHeader` and `SiteFooter`
 * both hide themselves on this route so the page stands alone.
 */
export default function NoticePage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper-warm px-6 py-20">
      <div className="w-full max-w-xl text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-line-strong bg-paper text-gold"
        >
          <ScalesMark className="h-8 w-8" />
        </span>

        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight text-ink">
          {declineNotice.heading}
        </h1>

        <div className="mt-6 space-y-4 text-left">
          {declineNotice.body.map((paragraph) => (
            <p
              key={paragraph.slice(0, 40)}
              className="leading-relaxed text-ink-soft"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-block rounded-full border border-line-strong px-7 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold"
          >
            Return to the disclaimer
          </Link>
        </div>

        <p className="mt-12 border-t border-line pt-6 text-xs text-slate-light">
          &copy; {new Date().getFullYear()} {firm.name}
        </p>
      </div>
    </div>
  );
}
