import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tabs, type TabDefinition } from "@/components/tabs";
import {
  CtaBand,
  FactList,
  FaqList,
  InsightCard,
  PageHero,
  ProseBlock,
  ServiceList,
  TeamGrid,
} from "@/components/ui";
import { industries, industryBySlug } from "@/content/industries";
import { practiceAreaBySlug } from "@/content/practice-areas";
import { insightsForIndustry } from "@/content/insights";
import { firm } from "@/content/firm";

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata(
  props: PageProps<"/domains/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const industry = industryBySlug.get(slug);

  if (!industry) return { title: "Domain not found" };

  return {
    title: `${industry.name} — Industry`,
    description: industry.tagline,
    alternates: { canonical: `/domains/${industry.slug}` },
    openGraph: {
      title: `${industry.name} | ${firm.name}`,
      description: industry.tagline,
      type: "article",
    },
  };
}

export default async function IndustryPage(
  props: PageProps<"/domains/[slug]">,
) {
  const { slug } = await props.params;
  const industry = industryBySlug.get(slug);

  if (!industry) notFound();

  const relatedInsights = insightsForIndustry(industry.slug, 3);
  const relatedPractices = industry.relatedPractices
    .map((practiceSlug) => practiceAreaBySlug.get(practiceSlug))
    .filter((practice): practice is NonNullable<typeof practice> =>
      Boolean(practice),
    );

  const tabs: TabDefinition[] = [
    {
      id: "overview",
      label: "Overview",
      panel: (
        <div className="space-y-10">
          {industry.overview.map((block) => (
            <ProseBlock
              key={block.heading}
              heading={block.heading}
              body={block.body}
            />
          ))}
        </div>
      ),
    },
    {
      id: "matters",
      label: "Common matters",
      panel: (
        <>
          <h2 className="sr-only">Common matters in this domain</h2>
          <ServiceList items={industry.commonMatters} />
        </>
      ),
    },
    {
      id: "work",
      label: "Representative work",
      panel: (
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Representative work
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            Factual descriptions of the kind of work handled in this sector.
            Client names and identifying details are omitted, and nothing here
            is a representation about the outcome of any matter.
          </p>
          <div className="mt-8">
            <FactList items={industry.representativeWork} />
          </div>
        </section>
      ),
    },
    {
      id: "regulators",
      label: "Regulators",
      panel: (
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Regulators and forums
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            The authorities, tribunals and courts that matters in this sector
            most often involve.
          </p>
          <div className="mt-8">
            <FactList items={industry.regulators} />
          </div>
        </section>
      ),
    },
    {
      id: "team",
      label: "Team",
      panel: (
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Sector team
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            The lawyers who most often advise clients in this domain.
          </p>
          <div className="mt-8">
            <TeamGrid slugs={industry.team} />
          </div>
        </section>
      ),
    },
    {
      id: "insights",
      label: "Insights",
      panel: (
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Related insights
          </h2>
          {relatedInsights.length ? (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2">
              {relatedInsights.map((insight) => (
                <li key={insight.slug}>
                  <InsightCard insight={insight} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 leading-relaxed text-slate">
              We have not yet published an insight for this domain.{" "}
              <Link href="/insights" className="text-gold-deep underline underline-offset-4">
                Browse all insights
              </Link>
              .
            </p>
          )}
        </section>
      ),
    },
    {
      id: "faqs",
      label: "FAQs",
      panel: (
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Frequently asked questions
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            General information about legal issues in this sector. It is not
            legal advice and does not create a lawyer&ndash;client relationship.
          </p>
          <div className="mt-8">
            <FaqList faqs={industry.faqs} />
          </div>
        </section>
      ),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Industry domain"
        title={industry.name}
        lead={industry.tagline}
        trail={[
          { label: "Home", href: "/" },
          { label: "Domains", href: "/domains" },
          { label: industry.shortName },
        ]}
      />

      <div className="mx-auto max-w-7xl px-6">
        <Tabs tabs={tabs} />
      </div>

      {relatedPractices.length > 0 && (
        <section className="border-t border-line bg-paper-warm">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2 className="eyebrow text-gold-deep">Related services</h2>
            <p className="mt-3 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-ink">
              Practice areas that serve this domain
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPractices.map((practice) => (
                <li key={practice.slug}>
                  <Link
                    href={`/services/${practice.slug}`}
                    className="group block h-full rounded-xl border border-line bg-paper p-5 transition hover:border-gold/40"
                  >
                    <h3 className="font-semibold text-ink transition group-hover:text-gold-deep">
                      {practice.shortName}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate">
                      {practice.tagline}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand
        title={`Request information — ${industry.shortName}`}
        body="Describe the matter briefly and we will route it to the right person for this sector."
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: industry.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
    </>
  );
}
