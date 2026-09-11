import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { PracticeIcon } from "@/components/practice-icon";
import { CtaBand, InsightCard, SectionHeading } from "@/components/ui";
import { firm, awards, offices } from "@/content/firm";
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

      {/* About — the heading and standing line sit opposite the prose. */}
      <section className="container-page py-14 sm:py-16">
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
              Bengaluru and Guntur, and before the courts, tribunals and
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
        <div className="container-page py-14 sm:py-16">
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

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {homePractices.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/services/${area.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg hover:shadow-ink/5"
                >
                  {/* Icon and title share a line. `items-start` with the
                      icon nudged down keeps it on the first line's cap height
                      for the titles that wrap to two. */}
                  <div className="flex items-start gap-3">
                    <PracticeIcon
                      slug={area.slug}
                      className="mt-0.5 h-6 w-6 shrink-0 text-gold"
                    />
                    <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold-deep">
                      {area.shortName}
                    </h3>
                  </div>

                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
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
      <section className="container-page py-14 sm:py-16">
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

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="container-page py-14 sm:py-16">
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

          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {latestInsights.map((insight) => (
              <li key={insight.slug}>
                <InsightCard insight={insight} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Awards */}
      <section className="container-page py-14 sm:py-16">
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

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft">
                {award.detail}
              </p>
              <p className="mt-4 text-xs text-slate-light">{award.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Locations + Careers teaser */}
      <section className="border-t border-line bg-paper-warm">
        <div className="container-page grid gap-12 py-14 lg:grid-cols-2 lg:gap-16 sm:py-16">
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
                  <address className="mt-2 space-y-0.5 text-sm not-italic text-ink-soft">
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
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-7 py-3.5 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
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
