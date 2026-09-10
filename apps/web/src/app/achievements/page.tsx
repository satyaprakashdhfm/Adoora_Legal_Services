import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/ui";
import { awards } from "@/content/firm";

export const metadata: Metadata = {
  title: "Achievements — Recognitions",
  description:
    "Recognitions received by ADOORA Legal Services, listed factually by year and awarding body.",
  alternates: { canonical: "/achievements" },
};

export default function AchievementsPage() {
  /** Group by year, newest first, so the list reads as a record. */
  const years = [...new Set(awards.map((award) => award.year))].sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <>
      <PageHero
        eyebrow="Achievements"
        title="Recognitions"
        lead="Listed factually with the year and the awarding body. Where a superlative appears, it forms part of the award title itself."
        trail={[{ label: "Home", href: "/" }, { label: "Achievements" }]}
      />

      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="space-y-14">
          {years.map((year) => (
            <section key={year}>
              <div className="flex items-center gap-4">
                <h2 className="font-serif text-3xl font-semibold text-ink">
                  {year}
                </h2>
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs uppercase tracking-[0.14em] text-slate-light">
                  {awards.filter((award) => award.year === year).length}{" "}
                  recognitions
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {awards
                  .filter((award) => award.year === year)
                  .map((award) => (
                    <li
                      key={award.title}
                      className="rounded-xl border border-line bg-paper-warm p-6 sm:p-7"
                    >
                      <p className="eyebrow text-gold-deep">{award.body}</p>
                      <h3 className="mt-2.5 font-serif text-xl font-semibold leading-snug tracking-tight text-ink">
                        {award.title}
                      </h3>
                      <p className="mt-2.5 leading-relaxed text-ink-soft">
                        {award.detail}
                      </p>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="mt-16 rounded-xl border border-line p-6">
          <h2 className="eyebrow text-slate-light">A note on rankings</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Directory rankings and awards are decided by the publishers named
            above on their own criteria and research. They are recorded here as
            a matter of fact. They are not a representation by the firm about
            the quality of its services or the outcome of any matter, and should
            not be relied upon in choosing legal representation.
          </p>
        </aside>
      </div>

      <CtaBand />
    </>
  );
}
