import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import {
  CtaBand,
  InsightCard,
  SectionHeading,
} from "@/components/ui";
import { firm, stats, awards, offices } from "@/content/firm";
import {
  practiceAreas,
  practiceGroups,
  practiceAreasByGroup,
} from "@/content/practice-areas";
import { industries } from "@/content/industries";
import { insightsByDate } from "@/content/insights";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${firm.name} — ${firm.tagline}`,
  description: firm.descriptor,
  alternates: { canonical: "/" },
};

/** Icons for the four practice groups. Kept inline — no icon font needed. */
const groupIcon: Record<string, string> = {
  Corporate: "M4 17V7l6-3 6 3v10M8 17v-5h4v5",
  Finance: "M3 16h14M5 16V9M9 16V6M13 16v-5M17 16v-8",
  Disputes: "M10 3v14M5 17h10M4 7h12M4 7l-2 5h4zM16 7l-2 5h4z",
  Regulatory: "M10 2l6 3v5c0 4-2.6 6.6-6 8-3.4-1.4-6-4-6-8V5l6-3z",
};

export default function Home() {
  const latestInsights = insightsByDate.slice(0, 3);
  const featuredAwards = awards.slice(0, 4);

  return (
    <>
      <Hero />

      {/* Trust strip — factual counters only. */}
      <section
        aria-label="The firm at a glance"
        className="border-b border-line bg-paper-warm"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-6 py-10 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-slate">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <SectionHeading
            eyebrow="About the firm"
            title="A full-service practice built around how work actually reaches a client"
          />
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
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
              <Link
                href="/about"
                className="text-sm font-semibold text-gold underline decoration-gold/30 underline-offset-4 transition hover:decoration-gold"
              >
                Read about our approach
              </Link>
              <Link
                href="/about#people"
                className="text-sm font-semibold text-ink-soft underline decoration-line-strong underline-offset-4 transition hover:text-gold"
              >
                Meet the team
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Practice areas — four grouped columns, mirroring the reference site. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Services"
              title="Our practice areas"
              lead="Each practice has its own page setting out the matters we handle, the process and timelines, the forums we appear before, and answers to the questions clients ask most."
            />
            <Link
              href="/services"
              className="shrink-0 rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold"
            >
              All practice areas
            </Link>
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {practiceGroups.map((group) => (
              <div key={group}>
                <div className="flex items-center gap-3 border-b border-line-strong pb-4">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-gold-bright"
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5">
                      <path
                        d={groupIcon[group]}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <h3 className="eyebrow text-ink">{group}</h3>
                </div>

                <ul className="mt-5 space-y-4">
                  {practiceAreasByGroup(group).map((area) => (
                    <li key={area.slug}>
                      <Link
                        href={`/services/${area.slug}`}
                        className="group block"
                      >
                        <span className="font-serif text-lg font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold">
                          {area.shortName}
                        </span>
                        <span className="mt-1.5 block text-sm leading-relaxed text-slate">
                          {area.tagline}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry domains */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Domains"
            title="Industries we work in"
            lead="Sector pages describe the regulatory landscape and transaction patterns a business in that industry actually faces, and the matters that follow from them."
          />
          <Link
            href="/domains"
            className="shrink-0 rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold"
          >
            All domains
          </Link>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={`/domains/${industry.slug}`}
                className="group flex h-full flex-col rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg hover:shadow-ink/5"
              >
                <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold">
                  {industry.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate">
                  {industry.tagline}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold"
                >
                  Explore
                  <svg viewBox="0 0 16 16" className="h-3 w-3">
                    <path
                      d="M2 8h11M9 4l4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Insights */}
      <section className="border-y border-line bg-paper-warm">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Insights"
              title="Thought leadership"
              lead="Explainers and regulatory updates written for the person who has to act on them."
            />
            <Link
              href="/insights"
              className="shrink-0 rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold"
            >
              All insights
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
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Achievements"
            title="Recognitions"
            lead="Listed factually, with the year and the awarding body."
          />
          <Link
            href="/achievements"
            className="shrink-0 rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold"
          >
            All recognitions
          </Link>
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featuredAwards.map((award) => (
            <li
              key={award.title}
              className="flex flex-col rounded-xl border border-line bg-paper-warm p-6"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
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
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-20 sm:py-24">
          <div>
            <SectionHeading eyebrow="Locations" title="Where we are" />
            <ul className="mt-8 space-y-6">
              {offices.map((office) => (
                <li
                  key={office.city}
                  className="border-l-2 border-gold/30 pl-5"
                >
                  <h3 className="font-serif text-lg font-semibold text-ink">
                    {office.city}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.14em] text-gold">
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

          <div className="flex flex-col justify-between rounded-2xl border border-line bg-ink p-8 text-white sm:p-10">
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
                className="rounded-full bg-gold-bright px-7 py-3.5 text-center text-sm font-semibold text-ink transition hover:bg-white"
              >
                Open roles
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-white/25 px-7 py-3.5 text-center text-sm font-semibold text-white transition hover:border-white/60"
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
            telephone: `+91${firm.phone}`,
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
