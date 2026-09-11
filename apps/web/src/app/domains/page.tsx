import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { industries } from "@/content/industries";

export const metadata: Metadata = {
  title: "Domains — Industries",
  description:
    "Industry domains at ADOORA Legal Services: financial services, infrastructure and energy, manufacturing, technology and media, real estate, healthcare, startups and the public sector.",
  alternates: { canonical: "/domains" },
};

export default function DomainsPage() {
  return (
    <>
      <PageHero
        eyebrow="Domains"
        title="Industry domains"
        lead="Sector pages set out the regulatory landscape and transaction patterns a business in that industry actually faces, the matters that follow, and the regulators involved."
        trail={[{ label: "Home", href: "/" }, { label: "Domains" }]}
      />

      <div className="container-page py-16 sm:py-20">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((industry) => (
            <li key={industry.slug}>
              <Link
                href={`/domains/${industry.slug}`}
                className="group flex h-full flex-col rounded-xl border border-line bg-paper p-7 transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg hover:shadow-ink/5"
              >
                <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold-deep">
                  {industry.name}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {industry.tagline}
                </p>

                <dl className="mt-6 flex-1 border-t border-line pt-5">
                  <dt className="eyebrow text-slate-light">Common matters</dt>
                  <dd className="mt-2.5">
                    <ul className="space-y-1.5">
                      {industry.commonMatters.slice(0, 3).map((matter) => (
                        <li
                          key={matter.title}
                          className="text-sm text-ink-soft"
                        >
                          {matter.title}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </dl>

                <span
                  aria-hidden="true"
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep"
                >
                  View domain
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
      </div>
    </>
  );
}
