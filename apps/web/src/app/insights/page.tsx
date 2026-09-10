import type { Metadata } from "next";
import { CtaBand, InsightCard, PageHero } from "@/components/ui";
import { insightsByDate, insightCategories } from "@/content/insights";

export const metadata: Metadata = {
  title: "Insights & News",
  description:
    "Regulatory updates, explainers and firm news from ADOORA Legal Services — written for the person who has to act on them.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
  const [lead, ...rest] = insightsByDate;

  /** Only show category chips that actually have content behind them. */
  const activeCategories = insightCategories.filter((category) =>
    insightsByDate.some((insight) => insight.category === category),
  );

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Insights & news"
        lead="Explainers and regulatory updates on the questions clients bring us most often. Informational only — none of it is legal advice."
        trail={[{ label: "Home", href: "/" }, { label: "Insights" }]}
      >
        <ul className="mt-8 flex flex-wrap gap-2">
          {activeCategories.map((category) => (
            <li
              key={category}
              className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs text-white/70"
            >
              {category}
            </li>
          ))}
        </ul>
      </PageHero>

      <div className="container-page py-16 sm:py-20">
        {/* Lead article gets a wider treatment. */}
        {lead && (
          <article className="group grid gap-8 border-b border-line pb-14 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <div>
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-paper-tint px-2.5 py-1 font-medium text-gold-deep">
                  {lead.category}
                </span>
                <time dateTime={lead.date} className="text-slate-light">
                  {new Date(lead.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <span className="text-slate-light">{lead.readingTime}</span>
              </div>

              <h2 className="mt-4 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink text-balance sm:text-3xl">
                <a
                  href={`/insights/${lead.slug}`}
                  className="transition group-hover:text-gold-deep"
                >
                  {lead.title}
                </a>
              </h2>

              <p className="mt-4 leading-relaxed text-slate">{lead.summary}</p>

              <a
                href={`/insights/${lead.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep"
              >
                Read the article
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
                  <path
                    d="M2 8h11M9 4l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            <aside className="rounded-xl border border-line bg-paper-warm p-6">
              <h3 className="eyebrow text-gold-deep">Key takeaways</h3>
              <ul className="mt-4 space-y-3">
                {lead.keyTakeaways.slice(0, 4).map((takeaway) => (
                  <li key={takeaway} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    />
                    <span className="text-sm leading-relaxed text-ink-soft">
                      {takeaway}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </article>
        )}

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((insight) => (
            <li key={insight.slug}>
              <InsightCard insight={insight} />
            </li>
          ))}
        </ul>
      </div>

      <CtaBand />
    </>
  );
}
