import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { InsightCard, SectionHeading } from "@/components/ui";
import { PracticesGrid } from "@/components/practices-grid";
import { CityIcon } from "@/components/city-icon";
import { OurApproach } from "@/components/our-approach";
import { firm, firmOverview, differentiators, offices } from "@/content/firm";
import { getFeaturedPeople, getInsights } from "@/lib/website-data";
import { PeopleCards } from "@/components/people-cards";
import { practiceAreas } from "@/content/practice-areas";
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

/** Display order for the home page's practice grid — banking, litigation
 *  and ADR lead, then the rest in their declared order. */
const practiceGridOrder = [
  "banking-finance",
  "litigation",
  "dispute-resolution",
  "corporate-ma",
  "real-estate-infrastructure",
  "taxation",
  "labour-employment",
  "intellectual-property",
  "regulatory-environmental",
];

export default async function Home() {
  /* Profiles marked "Show on the home page" in the admin console. The first
     three take the firm's studio portraits (people1–3 in public/), in order,
     unless a portrait has been uploaded for that person in the console. */
  const featuredPeople = (await getFeaturedPeople()).map((person, index) =>
    index < 3 && !person.photoUrl ? { ...person, photo: `people${index + 1}` } : person,
  );
  const latestInsights = (await getInsights()).slice(0, 3);
  const practiceGridItems = practiceGridOrder
    .map((slug) => practiceAreas.find((area) => area.slug === slug))
    .filter((area): area is (typeof practiceAreas)[number] => Boolean(area))
    .map((area) => ({
      area,
      photo: publicImage(`practice-photo-${area.slug}`),
      thumb: publicImage(`practice-${area.slug}`),
    }));
  /* Resolved at build time; a missing file falls back to the navy gradient,
     exactly as the hero frames do. */
  const careersImage = publicImage("careers-office");

  return (
    <>
      <Hero images={heroSlides.map((slide) => publicImage(slide.imageBase))} />

      {/* About — the heading and standing line sit opposite the prose. */}
      <section className="container-page pb-8 pt-6 sm:pb-10 sm:pt-7">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="About the firm"
              title="One firm for the dispute and the deal behind it"
            />
            <span
              aria-hidden="true"
              className="mt-8 block h-0.5 w-16 bg-gold"
            />
            <p className="mt-6 max-w-sm font-serif text-base leading-relaxed sm:mt-8 sm:text-lg text-ink-soft">
              Legal advice and representation for businesses, institutions
              and individuals.
            </p>
          </div>

          <div className="space-y-5 text-base leading-relaxed text-ink-soft">
            {firmOverview.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="flex flex-wrap gap-x-8 gap-y-3 pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gold-deep underline decoration-gold/40 underline-offset-[6px] transition hover:decoration-gold"
              >
                Read about our approach
                <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The team, below the about band — the profiles marked for the home
          page in the admin console, one per slide, auto-advancing. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page pb-8 pt-6 sm:pb-10 sm:pt-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Our people"
              title="The lawyers who lead each practice"
            />
            <Link
              href="/about#people"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
            >
              Meet the whole team
              <Arrow />
            </Link>
          </div>

          <div className="mt-6">
            <PeopleCards people={featuredPeople} />
          </div>
        </div>
      </section>

      {/* Practices — a 3 × 3 grid of photo cards, one per practice. Plain
          ground, same as About and Our approach: the home page already
          alternates paper and paper-warm bands section to section. The
          dense, bulleted index a visitor wants once they already know which
          practice they need lives at /services; this is the lighter teaser
          that gets them there. */}
      <section className="container-page pb-8 pt-6 sm:pb-10 sm:pt-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Our practices"
            title="Practice areas"
            lead="Nine areas of law, handled by one team that works across all of them."
          />
          <Link
            href="/services"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition hover:border-gold hover:text-gold-deep lg:self-auto"
          >
            View all practices
            <Arrow />
          </Link>
        </div>

        <div className="mt-6">
          <PracticesGrid items={practiceGridItems} />
        </div>
      </section>

      {/* Insights. Warm, between the paper practices and why-us bands — the
          home page alternates its grounds so no two neighbours read as one. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page pb-8 pt-6 sm:pb-10 sm:pt-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Insights"
              title="Articles &amp; publications"
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

          {/* A vertical stack of three full-width cards was most of a mobile
              screen's scroll. Below sm it is a snapping horizontal strip
              instead — each card most of the viewport with the next peeking
              in, so the section takes one screen's height rather than three;
              sm and up it is the grid it always was. */}
          <ul className="-mx-6 mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
            {latestInsights.map((insight) => (
              <li
                key={insight.slug}
                className="w-[82%] shrink-0 snap-center sm:w-auto sm:shrink"
              >
                <InsightCard insight={insight} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Our approach. Copy supplied by the firm — see the note on
          `differentiators` in firm.ts about the BCI advertising rules. A
          photograph beside a mosaic of five numbered cards. */}
      <section>
        <div className="container-page pb-8 pt-6 sm:pb-10 sm:pt-7">
          <SectionHeading eyebrow="The Standard" title="Our Approach" lead="What you can expect when you work with us." />

          <div className="mt-6">
            <OurApproach items={differentiators} />
          </div>
        </div>
      </section>

      {/* Locations and the careers teaser share one row — offices on the
          left, careers on the right. */}
      <section className="border-t border-line bg-paper-warm">
        <div className="container-page grid items-stretch gap-10 pb-8 pt-6 sm:pb-10 sm:pt-7 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          {/* The three offices, each card led by its city's landmark. */}
          <div>
            <SectionHeading
              eyebrow="Locations"
              title="Our legal presence"
              lead="With offices in Hyderabad, Bengaluru and Guntur, we are close to our clients across South India."
            />

            <div className="mt-9 grid gap-5 sm:grid-cols-3">
              {offices.map((office) => (
                <div
                  key={office.city}
                  className="rounded-xl border border-line bg-paper p-5"
                >
                  <CityIcon city={office.city} className="h-20 w-full" />
                  <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
                    {office.city}
                  </h3>
                  <address className="mt-3 space-y-0.5 text-[0.8rem] not-italic leading-relaxed text-ink-soft">
                    {office.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </address>
                </div>
              ))}
            </div>
          </div>

          {/* Careers. A photograph under the navy wash. */}
          <div className="relative isolate flex flex-col justify-center overflow-hidden rounded-xl bg-ink p-8 text-white sm:p-10">
            {careersImage ? (
              <>
                <Image
                  src={careersImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="-z-20 object-cover object-right"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_92%,transparent)_45%,color-mix(in_oklab,var(--color-ink)_55%,transparent)_100%)]"
                />
              </>
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))]"
              />
            )}

            <div className="px-2 sm:px-4">
              <SectionHeading
                eyebrow="Careers"
                title="Work with us"
                tone="dark"
                lead="We look for lawyers who want responsibility early and are willing to learn a matter properly before forming a view. Roles are listed with the eligibility and the practice they sit in."
              />

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/careers"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
                >
                  Open roles
                  <Arrow />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/5"
                >
                  About the firm
                </Link>
              </div>

              {/* The triad the firm's own photography carries, bulleted the
                  way the practice lists are. */}
              <ul className="mt-10 space-y-2.5 border-t border-white/15 pt-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/70">
                {["People", "Ideas", "Impact"].map((word) => (
                  <li key={word} className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    />
                    {word}
                  </li>
                ))}
              </ul>
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
              addressRegion: office.state,
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
