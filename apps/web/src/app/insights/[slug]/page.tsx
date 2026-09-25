import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsightCard, PageHero, formatDate } from "@/components/ui";
import { anchorFor } from "@/lib/anchor";
import {
  insights,
  insightBySlug,
  insightsByDate,
  type Block,
} from "@/content/insights";
import { getPeople } from "@/lib/website-data";
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
            return (
              <h2
                key={index}
                id={anchorFor(block.text)}
                style={{ scrollMarginTop: "var(--header-h, 4.5rem)" }}
              >
                {block.text}
              </h2>
            );
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

  const author = (await getPeople()).find((person) => person.slug === insight.author);
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

  /* The left rail's table of contents — the article's own h2 subheadings,
     in order, each pointing at the id BlockRenderer gives that heading. */
  const toc = insight.body
    .filter((block): block is Extract<Block, { type: "h2" }> => block.type === "h2")
    .map((block) => ({ text: block.text, id: anchorFor(block.text) }));

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
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate">
          {author && (
            <span>
              By{" "}
              <Link
                href={`/about#${author.slug}`}
                className="text-ink underline decoration-line-strong underline-offset-4 transition hover:text-gold-deep"
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
        {/* Rail on the left, article on the right — a reader can see the
            article's shape (and the author) before committing to reading it,
            rather than a Key Takeaways box that duplicated the summary above
            the fold. DOM order keeps the article first, so it reads before
            the rail on a phone; `lg:order-first` moves the rail to the left
            only once there is a second column to put it in. */}
        <div className="grid gap-12 lg:grid-cols-[15rem_1fr] lg:gap-14">
          <article className="min-w-0">
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

          {/* On-this-page rail: the article's own h2 subheadings, then the
              author. Sticky and clear of the header at whatever height it
              currently is. */}
          <aside className="lg:sticky lg:top-[calc(var(--header-h,4.5rem)+1.5rem)] lg:order-first lg:self-start">
            {toc.length > 0 && (
              <nav aria-label="On this page">
                <h2 className="eyebrow text-gold-deep">On this page</h2>
                <ul className="mt-4 space-y-2.5 border-l border-line text-sm">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="-ml-px block border-l-2 border-transparent py-0.5 pl-4 leading-snug text-ink-soft transition hover:border-gold/50 hover:text-gold-deep"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            {author && (
              <div className={toc.length > 0 ? "mt-8 border-t border-line pt-6" : undefined}>
                <h2 className="eyebrow text-slate-light">Author</h2>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-warm font-serif text-sm font-semibold text-gold-deep"
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
