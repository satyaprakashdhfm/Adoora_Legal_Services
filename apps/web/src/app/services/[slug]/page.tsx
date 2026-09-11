import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Tabs, type TabDefinition } from "@/components/tabs";
import {
  FactList,
  FaqList,
  InsightCard,
  PageHero,
  ProcessSteps,
  ProseBlock,
  ServiceList,
  TeamGrid,
} from "@/components/ui";
import { peopleBySlugs } from "@/content/people";
import { practiceAreas, practiceAreaBySlug } from "@/content/practice-areas";
import { industryBySlug } from "@/content/industries";
import { insightsForPractice } from "@/content/insights";
import { firm } from "@/content/firm";

/** Pre-render every practice area at build time. */
export function generateStaticParams() {
  return practiceAreas.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata(
  props: PageProps<"/services/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const area = practiceAreaBySlug.get(slug);

  if (!area) return { title: "Practice area not found" };

  return {
    title: area.name,
    description: area.tagline,
    alternates: { canonical: `/services/${area.slug}` },
    openGraph: {
      title: `${area.name} | ${firm.name}`,
      description: area.tagline,
      type: "article",
    },
  };
}

export default async function PracticeAreaPage(
  props: PageProps<"/services/[slug]">,
) {
  const { slug } = await props.params;
  const area = practiceAreaBySlug.get(slug);

  if (!area) notFound();

  const relatedInsights = insightsForPractice(area.slug, 3);
  const relatedIndustries = area.relatedIndustries
    .map((industrySlug) => industryBySlug.get(industrySlug))
    .filter((industry): industry is NonNullable<typeof industry> =>
      Boolean(industry),
    );

  const tabs: TabDefinition[] = [
    {
      id: "overview",
      label: "Overview",
      panel: (
        <div className="space-y-10">
          {area.overview.map((block) => (
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
      id: "services",
      label: "What we handle",
      panel: (
        <>
          <h2 className="sr-only">What we handle</h2>
          <ServiceList items={area.services} />
        </>
      ),
    },
    {
      id: "process",
      label: "Process & forums",
      panel: (
        <div className="space-y-14">
          <section>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              How the work is sequenced
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
              Indicative stages and what each produces. Timelines depend on the
              matter — where we can give a realistic range, the FAQs below say
              so.
            </p>
            <div className="mt-8">
              <ProcessSteps steps={area.process} />
            </div>
          </section>

          <section className="border-t border-line pt-10">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Jurisdictions, forums and regulators
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
              Where matters in this practice are heard, filed or determined.
            </p>
            <div className="mt-8">
              <FactList items={area.forums} />
            </div>
          </section>
        </div>
      ),
    },
    {
      id: "matters",
      label: "Representative matters",
      panel: (
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
            Representative matters
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            Descriptions of the kind of work the team handles. Client names and
            identifying details are omitted, and nothing here should be read as
            a representation about the outcome of any matter.
          </p>
          <div className="mt-8">
            <FactList items={area.matters} />
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
            Practice team
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            The lawyers who lead this practice.
          </p>
          <div className="mt-8">
            <TeamGrid slugs={area.team} />
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
            <p className="mt-4 leading-relaxed text-ink-soft">
              We have not yet published an insight in this practice area.{" "}
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
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            General information about how this practice works. It is not legal
            advice and does not create a lawyer&ndash;client relationship.
          </p>
          <div className="mt-8">
            <FaqList faqs={area.faqs} />
          </div>
        </section>
      ),
    },
  ]
    // The firm has not assigned lawyers to individual practices yet, so
    // the Team tab only appears once `team` resolves to somebody.
    .filter(
      (tab) => tab.id !== "team" || peopleBySlugs(area.team).length > 0,
    );

  return (
    <>
      <PageHero
        eyebrow="Practice area"
        title={area.name}
        lead={area.tagline}
        trail={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: area.shortName },
        ]}
      />

      <div className="container-page">
        <Tabs tabs={tabs} />
      </div>

      {/* Cross-links to the industry pages this practice most often serves. */}
      {relatedIndustries.length > 0 && (
        <section className="border-t border-line bg-paper-warm">
          <div className="container-page py-16">
            <h2 className="eyebrow text-gold-deep">Related domains</h2>
            <p className="mt-3 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-ink">
              Industries where this practice is most active
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedIndustries.map((industry) => (
                <li key={industry.slug}>
                  <Link
                    href={`/domains/${industry.slug}`}
                    className="group block h-full rounded-xl border border-line bg-paper p-5 transition hover:border-gold/40"
                  >
                    <h3 className="font-semibold text-ink transition group-hover:text-gold-deep">
                      {industry.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {industry.tagline}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FAQPage structured data, for search and AI-overview citation. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: area.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: area.name,
            description: area.tagline,
            provider: { "@type": "LegalService", name: firm.name },
            areaServed: ["Telangana", "Andhra Pradesh", "Karnataka"],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: `${area.name} services`,
              itemListElement: area.services.map((service) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: service.title,
                  description: service.body,
                },
              })),
            },
          }),
        }}
      />
    </>
  );
}
