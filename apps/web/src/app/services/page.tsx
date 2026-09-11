import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/ui";
import { PracticesIndex } from "@/components/practices-index";
import { industries } from "@/content/industries";

export const metadata: Metadata = {
  title: "Our Practices",
  description:
    "Practices at ADOORA Legal Services and the matters inside each: corporate and M&A, banking and finance, dispute resolution, real estate, labour and employment, technology, taxation and intellectual property.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Practices"
        title="Our practices"
        lead="The matters we handle, grouped by practice. Each practice has its own page setting out how the work is sequenced, the courts, tribunals and regulators involved, and the questions clients ask most often."
        trail={[{ label: "Home", href: "/" }, { label: "Practices" }]}
      />

      <div className="container-page py-14 sm:py-16">
        <PracticesIndex />
      </div>

      {/* Sector pages sit alongside the practices rather than in the nav. */}
      <section className="border-t border-line bg-paper-warm">
        <div className="container-page py-14 sm:py-16">
          <h2 className="eyebrow text-gold-deep">Sectors</h2>
          <p className="mt-3 max-w-2xl font-serif text-2xl font-semibold tracking-tight text-ink">
            The industries these practices serve
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            Each sector page sets out the regulatory landscape and transaction
            patterns a business in that industry actually faces, and the matters
            that follow from them.
          </p>

          <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => (
              <li key={industry.slug}>
                <Link
                  href={`/domains/${industry.slug}`}
                  className="group block border-t border-line-strong pt-3 transition"
                >
                  <span className="font-medium text-ink transition group-hover:text-gold-deep">
                    {industry.name}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-slate">
                    {industry.tagline}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
