import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { CtaBand, InsightCard, SectionHeading } from "@/components/ui";
import { firm, stats, awards, offices } from "@/content/firm";
import { practiceAreas } from "@/content/practice-areas";
import { industries } from "@/content/industries";
import { insightsByDate } from "@/content/insights";
import { heroSlides } from "@/content/hero-slides";
import { publicImage } from "@/lib/public-image";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${firm.name} — ${firm.tagline}`,
  description: firm.descriptor,
  alternates: { canonical: "/" },
};

/**
 * One icon per practice area, keyed by slug. Kept inline as 20×20 stroke
 * paths — no icon font, and they inherit the gold from the card.
 */
const practiceIcon: Record<string, string> = {
  "corporate-ma":
    "M4 17h12M6 17V4h8v13M8.5 7h1M11 7h1M8.5 10h1M11 10h1M8.5 13h1M11 13h1",
  "banking-finance": "M3 16.5h14M6 16.5V9M10 16.5V4.5M14 16.5v-4.5",
  "dispute-resolution":
    "M10 4v12M6.5 16h7M4 8h12M4 8l-2 4.5h4zM16 8l-2 4.5h4z",
  "technology-media-telecom": "M10 2.5l6 2.8v4.6c0 3.8-2.5 6.3-6 7.6-3.5-1.3-6-3.8-6-7.6V5.3l6-2.8z",
  "real-estate-infrastructure": "M2.8 9L10 3.6 17.2 9M4.6 10.4V17h10.8v-6.6M8.4 17v-4h3.2v4",
  taxation: "M5 2.8h6.5L15 6.3V17.2H5zM11.5 2.8v3.5H15M7.6 10h4.8M7.6 13.2h4.8",
  "labour-employment":
    "M7 9.2a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6zM13 9.2a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6zM2.8 16.4c0-2.3 1.9-4.2 4.2-4.2s4.2 1.9 4.2 4.2M11.6 12.6a4.2 4.2 0 015.6 3.8",
  "intellectual-property":
    "M10 2.8a4.6 4.6 0 00-2.7 8.3c.4.3.7.8.7 1.3v.6h4v-.6c0-.5.3-1 .7-1.3A4.6 4.6 0 0010 2.8zM8.4 16.6h3.2",
};

/** Practice order for the home grid — flagship practices first. */
const practiceOrder = [
  "corporate-ma",
  "banking-finance",
  "dispute-resolution",
  "technology-media-telecom",
  "real-estate-infrastructure",
  "taxation",
  "labour-employment",
  "intellectual-property",
];

const homePractices = [...practiceAreas].sort(
  (a, b) => practiceOrder.indexOf(a.slug) - practiceOrder.indexOf(b.slug),
);

/** Right-pointing arrow shared by the links and pills on this page. */
function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 ${className}`}>
      <path
        d="M2 8h11M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const latestInsights = insightsByDate.slice(0, 3);
  const featuredAwards = awards.slice(0, 4);

  return (
    <>
      <Hero images={heroSlides.map((slide) => publicImage(slide.imageBase))} />

      {/* Trust strip — factual counters only, divided by hairlines. */}
      <section
        aria-label="The firm at a glance"
        className="border-b border-line bg-paper-warm"
      >
        <div className="container-page grid grid-cols-2 gap-y-10 py-12 lg:grid-cols-4">
          {stats.map((stat, index) => {
            /* Hairlines divide the columns, so the first cell in each row
               carries none: index 0 at every width, and index 2 only until
               the grid widens from two columns to four. */
            const divider =
              index === 0
                ? "lg:pl-0"
                : index % 2 === 1
                  ? "border-l border-line-strong"
                  : "lg:border-l lg:border-line-strong";

            return (
              <div key={stat.label} className={`px-2 lg:px-8 ${divider}`}>
                <p className="font-serif text-3xl font-semibold text-gold-deep sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-slate">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* About — the heading and standing line sit opposite the prose. */}
      <section className="container-page py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="About the firm"
              title="A full-service practice built around how work actually reaches a client"
            />
            <span
              aria-hidden="true"
              className="mt-8 block h-0.5 w-16 bg-gold"
            />
            <p className="mt-8 max-w-sm font-serif text-lg leading-relaxed text-ink-soft">
              Strategic legal solutions for businesses, institutions and
              individuals.
            </p>
          </div>

          <div className="space-y-5 text-base leading-relaxed text-ink-soft">
            <p>
              {firm.name} advises Indian and international clients on corporate
              transactions, financing, regulatory matters and dispute
              resolution. We act for domestic and foreign commercial
              enterprises, financial institutions, private equity and venture
              capital funds, promoter-led businesses, start-ups, and government
              and regulatory bodies.
            </p>
            <p>
              Most instructions do not arrive neatly labelled. A financing turns
              on a land title question; an acquisition turns on an employment
              exposure; a regulatory notice turns into litigation. The firm is
              organised so that the person who structures a matter is still
              involved when it is tested — across offices in Hyderabad,
              Amaravati and Bengaluru, and before the courts, tribunals and
              regulators of Telangana, Andhra Pradesh and Karnataka.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gold-deep underline decoration-gold/40 underline-offset-[6px] transition hover:decoration-gold"
              >
                Read about our approach
                <Arrow />
              </Link>
              <Link
                href="/about#people"
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft underline decoration-line-strong underline-offset-[6px] transition hover:text-gold-deep"
              >
                Meet the team
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Practice areas — one card per practice, in a four-up grid. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-20 sm:py-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Services"
              title="Our practice areas"
              lead="Each practice has its own page setting out the matters we handle, the process and timelines, the forums we appear before, and answers to the questions clients ask most."
            />
            <Link
              href="/services"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
            >
              View all practice areas
              <Arrow />
            </Link>
          </div>

          <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {homePractices.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/services/${area.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-ink/5"
                >
                  <span aria-hidden="true" className="text-gold">
                    <svg viewBox="0 0 20 20" className="h-7 w-7">
                      <path
                        d={practiceIcon[area.slug]}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <h3 className="mt-5 font-serif text-lg font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold-deep">
                    {area.shortName}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">
                    {area.tagline}
                  </p>

                  <span
                    aria-hidden="true"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep"
                  >
                    Learn more
                    <Arrow className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Industry domains — dark tiles, name and sector line stacked at the
          foot of each. */}
      <section className="container-page py-20 sm:py-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Domains"
            title="Industries we work in"
            lead="Sector pages describe the regulatory landscape and transaction patterns a business in that industry actually faces, and the matters that follow from them."
          />
          <Link
            href="/domains"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
          >
            View all domains
            <Arrow />
          </Link>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={`/domains/${industry.slug}`}
                className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl bg-ink p-6 text-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ink/15"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))] transition-opacity group-hover:opacity-90"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 top-6 h-px bg-gold/40"
                />

                <h3 className="relative font-serif text-lg font-semibold leading-snug tracking-tight">
                  {industry.name}
                </h3>
                <p className="relative mt-2 text-xs leading-relaxed text-white/65">
                  {industry.tagline}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Insights */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-20 sm:py-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Insights"
              title="Thought leadership"
              lead="Explainers and regulatory updates written for the person who has to act on them."
            />
            <Link
              href="/insights"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
            >
              View all insights
              <Arrow />
            </Link>
          </div>

          <ul className="mt-14 grid gap-5 lg:grid-cols-3">
            {latestInsights.map((insight) => (
              <li key={insight.slug}>
                <InsightCard insight={insight} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Awards */}
      <section className="container-page py-20 sm:py-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Achievements"
            title="Recognitions"
            lead="Listed factually, with the year and the awarding body."
          />
          <Link
            href="/achievements"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
          >
            View all recognitions
            <Arrow />
          </Link>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredAwards.map((award) => (
            <li
              key={award.title}
              className="flex flex-col rounded-xl border border-line bg-paper-warm p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-deep">
                {award.year}
              </span>
              <h3 className="mt-3 font-serif text-base font-semibold leading-snug text-ink">
                {award.title}
              </h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate">
                {award.detail}
              </p>
              <p className="mt-4 text-xs text-slate-light">{award.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Locations + Careers teaser */}
      <section className="border-t border-line bg-paper-warm">
        <div className="container-page grid gap-12 py-20 lg:grid-cols-2 lg:gap-20 sm:py-24">
          <div>
            <SectionHeading eyebrow="Locations" title="Where we are" />
            <ul className="mt-8 space-y-6">
              {offices.map((office) => (
                <li key={office.city} className="border-l-2 border-gold/40 pl-5">
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {office.city}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.14em] text-gold-deep">
                    {office.label}
                  </p>
                  <address className="mt-2 space-y-0.5 text-sm not-italic text-slate">
                    {office.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </address>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative isolate flex flex-col justify-between overflow-hidden rounded-2xl bg-ink p-8 text-white sm:p-10">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-gold/15 blur-3xl"
            />

            <div>
              <SectionHeading
                eyebrow="Careers"
                title="Work with us"
                tone="dark"
                lead="We look for lawyers who want responsibility early and are willing to learn a matter properly before forming a view. Roles are listed with the eligibility and the practice they sit in."
              />
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/careers"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-7 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold-bright"
              >
                Open roles
                <Arrow />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-md border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5"
              >
                About the firm
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />

      {/* Organisation schema. Practice and industry pages add their own. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LegalService",
            name: firm.name,
            description: firm.descriptor,
            url: siteUrl,
            telephone: firm.phoneE164,
            email: firm.email,
            areaServed: ["Telangana", "Andhra Pradesh", "Karnataka"],
            address: offices.map((office) => ({
              "@type": "PostalAddress",
              addressLocality: office.city,
              addressRegion: office.label,
              addressCountry: "IN",
              streetAddress: office.lines[0],
            })),
            knowsAbout: practiceAreas.map((area) => area.name),
          }),
        }}
      />
    </>
  );
}
