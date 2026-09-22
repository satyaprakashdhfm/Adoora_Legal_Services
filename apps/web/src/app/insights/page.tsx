import type { Metadata } from "next";
import { InsightCard, PageHero } from "@/components/ui";
import { insightsByDate, insightCategories } from "@/content/insights";

export const metadata: Metadata = {
  title: "Insights & News",
  description:
    "Regulatory updates, explainers and firm news from ADOORA Legal Services — written for the person who has to act on them.",
  alternates: { canonical: "/insights" },
};

export default function InsightsPage() {
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
        image
      >
        <ul className="mt-8 flex flex-wrap gap-2">
          {activeCategories.map((category) => (
            <li
              key={category}
              className="rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-xs text-ink-soft"
            >
              {category}
            </li>
          ))}
        </ul>
      </PageHero>

      <div className="container-page py-16 sm:py-20">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {insightsByDate.map((insight) => (
            <li key={insight.slug}>
              <InsightCard insight={insight} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
