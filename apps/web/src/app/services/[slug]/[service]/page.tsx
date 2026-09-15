import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FactList,
  InsightCard,
  PageHero,
  ProcessSteps,
} from "@/components/ui";
import {
  findService,
  practiceAreaBySlug,
  practiceAreas,
  serviceHref,
  serviceSlug,
} from "@/content/practice-areas";
import { insightsForPractice } from "@/content/insights";
import { firm } from "@/content/firm";

/**
 * One page per service inside a practice — the case types the practices index
 * lists. The service itself supplies a title and a paragraph; the process and
 * forums are the practice's own, because that is what they are. Nothing here is
 * written per service that the content file does not already say.
 */
export function generateStaticParams() {
  return practiceAreas.flatMap((area) =>
    area.services.map((service) => ({
      slug: area.slug,
      service: serviceSlug(service),
    })),
  );
}

/** Only the services above exist; anything else is a 404, not a render. */
export const dynamicParams = false;

export async function generateMetadata(
  props: PageProps<"/services/[slug]/[service]">,
): Promise<Metadata> {
  const { slug, service: serviceParam } = await props.params;
  const area = practiceAreaBySlug.get(slug);
  const service = area && findService(area, serviceParam);

  if (!area || !service) return { title: "Service not found" };

  return {
    title: `${service.title} — ${area.shortName}`,
    description: service.body,
    alternates: { canonical: serviceHref(area, service) },
    openGraph: {
      title: `${service.title} | ${firm.name}`,
      description: service.body,
      type: "article",
    },
  };
}

export default async function ServicePage(
  props: PageProps<"/services/[slug]/[service]">,
) {
  const { slug, service: serviceParam } = await props.params;
  const area = practiceAreaBySlug.get(slug);
  const service = area && findService(area, serviceParam);

  if (!area || !service) notFound();

  const relatedInsights = insightsForPractice(area.slug, 2);

  return (
    <>
      <PageHero
        eyebrow={area.name}
        title={service.title}
        trail={[
          { label: "Home", href: "/" },
          { label: "Services", href: "/services" },
          { label: area.shortName, href: `/services/${area.slug}` },
          { label: service.title },
        ]}
      />

      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
          <article className="min-w-0">
            <section>
              <h2 className="eyebrow inline-flex items-center gap-2.5 text-gold-deep">
                <span aria-hidden="true" className="h-px w-8 bg-gold/50" />
                What this covers
              </h2>
              <p className="mt-5 border-l-2 border-gold pl-6 text-lg leading-relaxed text-ink">
                {service.body}
              </p>
            </section>

            <section className="mt-12 border-t border-line pt-10">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                How the work is sequenced
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
                The stages {area.shortName} matters move through. Timelines
                depend on the matter.
              </p>
              <div className="mt-8">
                <ProcessSteps steps={area.process} />
              </div>
            </section>

            <section className="mt-12 border-t border-line pt-10">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                Where it is heard
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
                The courts, tribunals and regulators this work comes before.
              </p>
              <div className="mt-6">
                <FactList items={area.forums} />
              </div>
            </section>

            {relatedInsights.length > 0 && (
              <section className="mt-12 border-t border-line pt-10">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                  Related insights
                </h2>
                <ul className="mt-8 grid gap-5 sm:grid-cols-2">
                  {relatedInsights.map((insight) => (
                    <li key={insight.slug}>
                      <InsightCard insight={insight} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          <aside className="space-y-5 lg:sticky lg:top-40 lg:self-start">
            <nav
              aria-label={`${area.shortName} services`}
              className="rounded-2xl border border-line bg-paper-warm p-6"
            >
              <h2 className="eyebrow text-gold-deep">
                More in {area.shortName}
              </h2>
              <ul className="mt-4 space-y-1">
                {area.services.map((item) => {
                  const current = item.title === service.title;

                  return (
                    <li key={item.title}>
                      <Link
                        href={serviceHref(area, item)}
                        aria-current={current ? "page" : undefined}
                        className={`flex gap-2.5 rounded-md px-2 py-1.5 text-sm leading-snug transition ${
                          current
                            ? "bg-paper font-semibold text-ink"
                            : "text-ink-soft hover:text-gold-deep"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full ${
                            current ? "bg-gold" : "bg-gold/40"
                          }`}
                        />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/services/${area.slug}`}
                className="mt-5 inline-flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold text-gold-deep transition hover:text-ink"
              >
                {area.shortName} overview
                <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                  <path
                    d="M2 8h11M9 4l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </nav>

            <div className="rounded-2xl bg-ink p-6 text-white">
              <h2 className="font-serif text-lg font-semibold">
                Discuss a matter
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Tell us briefly what it concerns and we will route it to the
                right person. {firm.responseTime}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
              >
                Contact us
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            serviceType: area.name,
            description: service.body,
            provider: { "@type": "LegalService", name: firm.name },
            areaServed: ["Telangana", "Andhra Pradesh", "Karnataka"],
          }),
        }}
      />
    </>
  );
}
