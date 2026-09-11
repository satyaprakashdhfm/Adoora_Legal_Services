import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightCard, PageHero, formatDate } from "@/components/ui";
import {
  insights,
  insightBySlug,
  insightsByDate,
  type Block,
} from "@/content/insights";
import { personBySlug } from "@/content/people";
import { practiceAreaBySlug } from "@/content/practice-areas";
import { industryBySlug } from "@/content/industries";
import { firm } from "@/content/firm";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return insights.map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata(
  props: PageProps<"/insights/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const insight = insightBySlug.get(slug);

  if (!insight) return { title: "Article not found" };

  return {
    title: insight.title,
    description: insight.summary,
    alternates: { canonical: `/insights/${insight.slug}` },
    openGraph: {
      title: insight.title,
      description: insight.summary,
      type: "article",
      publishedTime: insight.date,
    },
  };
}

/** Renders the small block vocabulary used by `insights.ts`. */
function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return <h2 key={index}>{block.text}</h2>;
          case "p":
            return <p key={index}>{block.text}</p>;
          case "ul":
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="my-8 border-l-2 border-gold pl-6 font-serif text-xl leading-relaxed text-ink"
              >
                {block.text}
              </blockquote>
            );
        }
      })}
    </>
  );
}

export default async function InsightPage(
  props: PageProps<"/insights/[slug]">,
) {
  const { slug } = await props.params;
  const insight = insightBySlug.get(slug);

  if (!insight) notFound();

  const author = personBySlug.get(insight.author);
  const tags = [
    ...insight.practices.map((practiceSlug) => {
      const practice = practiceAreaBySlug.get(practiceSlug);
      return practice
        ? { label: practice.shortName, href: `/services/${practice.slug}` }
        : null;
    }),
    ...insight.industries.map((industrySlug) => {
      const industry = industryBySlug.get(industrySlug);
      return industry
        ? { label: industry.shortName, href: `/domains/${industry.slug}` }
        : null;
    }),
  ].filter((tag): tag is { label: string; href: string } => Boolean(tag));

  const related = insightsByDate
    .filter((other) => other.slug !== insight.slug)
    .filter(
      (other) =>
        other.practices.some((p) => insight.practices.includes(p)) ||
        other.industries.some((i) => insight.industries.includes(i)),
    )
    .slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={insight.category}
        title={insight.title}
        trail={[
          { label: "Home", href: "/" },
          { label: "Insights", href: "/insights" },
          { label: insight.category },
        ]}
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
          {author && (
            <span>
              By{" "}
              <Link
                href={`/about#${author.slug}`}
                className="text-white underline decoration-white/30 underline-offset-4 transition hover:text-gold-bright"
              >
                {author.name}
              </Link>
              , {author.designation}
            </span>
          )}
          <time dateTime={insight.date}>{formatDate(insight.date)}</time>
          <span>{insight.readingTime}</span>
        </div>
      </PageHero>

      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_19rem] lg:gap-16">
          <article>
            <p className="border-l-2 border-gold pl-6 text-lg leading-relaxed text-ink">
              {insight.summary}
            </p>

            <div className="prose-adoora mt-10 max-w-none">
              <BlockRenderer blocks={insight.body} />
            </div>

            {/* Not-legal-advice notice — required on every article. */}
            <aside className="mt-12 rounded-xl border border-line bg-paper-warm p-6">
              <h2 className="eyebrow text-gold-deep">Please note</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                This article is for general information only. It reflects the
                position as understood on the date of publication, is not legal
                advice, and does not create a lawyer&ndash;client relationship.
                Law and regulatory practice change; before acting on anything
                here you should seek independent legal advice on your own
                circumstances.
              </p>
            </aside>

            {tags.length > 0 && (
              <div className="mt-10 border-t border-line pt-8">
                <h2 className="eyebrow text-slate-light">Filed under</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={`${tag.href}-${tag.label}`}>
                      <Link
                        href={tag.href}
                        className="inline-block rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-soft transition hover:border-gold hover:text-gold-deep"
                      >
                        {tag.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Sticky takeaways + author rail */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-xl border border-line bg-paper-warm p-6">
              <h2 className="eyebrow text-gold-deep">Key takeaways</h2>
              <ul className="mt-4 space-y-3">
                {insight.keyTakeaways.map((takeaway) => (
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
            </div>

            {author && (
              <div className="mt-5 rounded-xl border border-line p-6">
                <h2 className="eyebrow text-slate-light">Author</h2>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-paper-warm font-serif text-sm font-semibold text-gold-deep"
                  >
                    {author.initials}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{author.name}</p>
                    <p className="text-xs text-slate">{author.designation}</p>
                  </div>
                </div>
                <Link
                  href={`/about#${author.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-gold-deep underline decoration-gold/30 underline-offset-4"
                >
                  Full profile
                </Link>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-line pt-14">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Related insights
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <li key={other.slug}>
                  <InsightCard insight={other} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: insight.title,
            description: insight.summary,
            datePublished: insight.date,
            dateModified: insight.date,
            author: author
              ? { "@type": "Person", name: author.name, jobTitle: author.designation }
              : { "@type": "Organization", name: firm.name },
            publisher: { "@type": "Organization", name: firm.name },
            mainEntityOfPage: `${siteUrl}/insights/${insight.slug}`,
            articleSection: insight.category,
          }),
        }}
      />
    </>
  );
}
