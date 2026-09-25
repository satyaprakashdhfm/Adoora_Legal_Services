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
import { getPeople, teamFor } from "@/lib/website-data";
import { practiceAreas, practiceAreaBySlug } from "@/content/practice-areas";
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
  const team = teamFor(await getPeople(), { practice: area.slug, slugs: area.team });

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

          {/* What we handle — each item opens its own page. `id="services"`
              keeps old `#services` links landing here. */}
          <section
            id="services"
            className="scroll-mt-44 border-t border-line pt-10 lg:scroll-mt-56"
          >
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              What we handle
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
              The work inside this practice. Each has its own page setting out
              what it covers, how it is sequenced and where it is heard.
            </p>
            <div className="mt-8">
              <ServiceList
                items={area.services}
                basePath={`/services/${area.slug}`}
              />
            </div>
          </section>
        </div>
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
            <TeamGrid members={team} />
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
      (tab) => tab.id !== "team" || team.length > 0,
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
