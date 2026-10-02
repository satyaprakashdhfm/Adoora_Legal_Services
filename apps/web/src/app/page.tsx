import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { InsightCard, SectionHeading } from "@/components/ui";
import { PracticesGrid } from "@/components/practices-grid";
import { CityIcon } from "@/components/city-icon";
import { OurApproach } from "@/components/our-approach";
import { firm, firmOverview, differentiators, offices } from "@/content/firm";
import { getFeaturedPeople, getInsights, STUDIO_PORTRAITS } from "@/lib/website-data";
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
  /* Profiles marked "Feature on the home page" in the admin console. The
     founder and the two partners use the firm's studio portraits (people1-3
     in public/) unless a portrait has been uploaded for them in the console;
     anyone else shows their uploaded portrait. */
  const featuredPeople = (await getFeaturedPeople()).map((person) =>
    !person.photoUrl && STUDIO_PORTRAITS[person.slug] ? { ...person, photo: STUDIO_PORTRAITS[person.slug] } : person,
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

      {/* About. The heading, standing line and link on the left; the prose
          opposite, starting level with the heading rather than the eyebrow,
          so the two columns read as one block. */}
      <section className="container-page py-10 sm:py-12 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
          <div>
            <SectionHeading
              eyebrow="About the firm"
              title="One firm for the dispute and the deal behind it"
              size="large"
            />
            <p className="mt-4 max-w-md font-serif text-base leading-relaxed text-ink-soft sm:text-lg">
              Legal advice and representation for businesses, institutions
              and individuals.
            </p>
            <Link
              href="/about"
              className="mt-6 hidden items-center gap-2 text-sm font-semibold text-gold-deep underline decoration-gold/40 underline-offset-[6px] transition hover:decoration-gold lg:inline-flex"
            >
              Read about our approach
              <Arrow />
            </Link>
          </div>

          <div className="space-y-4 text-base leading-relaxed text-ink-soft lg:pt-10 lg:text-[1.0625rem]">
            {firmOverview.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {/* On phones the link follows the prose instead. */}
            <Link
              href="/about"
              className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-gold-deep underline decoration-gold/40 underline-offset-[6px] transition hover:decoration-gold lg:hidden"
            >
              Read about our approach
              <Arrow />
            </Link>
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
            lead="Our practice brings together diverse areas of law, with a shared focus on clear, practical legal advice."
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
              lead="Perspectives from our lawyers on evolving laws, important developments, and the issues shaping legal practice."
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
          {/* The three offices, each card led by its city's landmark.
              min-w-0 keeps the phone strip from widening the grid. */}
          <div className="min-w-0">
            <SectionHeading
              eyebrow="Locations"
              title="Our legal presence"
              lead="With offices in Hyderabad, Bengaluru and Guntur, we are close to our clients across South India."
            />

            <div className="-mx-6 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:mt-9 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {offices.map((office) => (
                <div
                  key={office.city}
                  className="w-[78%] shrink-0 snap-center rounded-xl border border-line bg-paper p-5 sm:w-auto sm:shrink"
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
                lead="We look for lawyers who want responsibility early and are willing to learn a case properly before forming a view. Roles are listed with the eligibility and the practice they sit in."
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
