import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { InsightCard, SectionHeading } from "@/components/ui";
import { PracticesIndex } from "@/components/practices-index";
import { firm, differentiators, offices } from "@/content/firm";
import { practiceAreas } from "@/content/practice-areas";
import { insightsByDate } from "@/content/insights";
import { heroSlides } from "@/content/hero-slides";
import { publicImage } from "@/lib/public-image";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: `${firm.name} — ${firm.tagline}`,
  description: firm.descriptor,
  alternates: { canonical: "/" },
};

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

      {/* Practices — a numbered row per practice, listing its case types.
          This replaced two card grids (practices and industry domains): the
          cards described the practice in a line and hid the work, and a
          visitor arrives looking for "insolvency" or "RERA". Sector pages are
          reached from each practice page and the footer. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-14 sm:py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Practices"
              title="Our practices"
              lead="The matters we handle, grouped by practice. Each practice has its own page setting out the process and timelines, the forums we appear before, and answers to the questions clients ask most."
            />
            <Link
              href="/services"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
            >
              View all practices
              <Arrow />
            </Link>
          </div>

          <div className="mt-12">
            <PracticesIndex />
          </div>
        </div>
      </section>

      {/* Insights. Plain paper — the practices band above it is warm, and two
          warm bands in a row read as one section. */}
      <section>
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

      {/* Why clients work with us. Replaced a recognitions list whose entries
          the firm could not substantiate. Every line here is a statement about
          how the firm works, not a ranking claim — the BCI rules on
          advertising do not permit the latter. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-14 sm:py-16">
          <SectionHeading
            eyebrow="Why clients work with us"
            title="What you can hold us to"
            lead="Not a ranking and not a claim about other firms — four things we try to do on every matter."
          />

          <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((item, index) => (
              <li key={item.title}>
                <span
                  aria-hidden="true"
                  className="font-serif text-2xl font-semibold text-gold/50"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-lg font-semibold leading-snug tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Locations + Careers teaser. Plain paper — the why-us band above
          it is warm. */}
      <section className="border-t border-line">
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
