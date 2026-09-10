import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/ui";
import {
  practiceGroups,
  practiceAreasByGroup,
} from "@/content/practice-areas";

export const metadata: Metadata = {
  title: "Services — Practice Areas",
  description:
    "Practice areas at ADOORA Legal Services: corporate and M&A, banking and finance, dispute resolution, real estate, labour and employment, technology, taxation and intellectual property.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Practice areas"
        lead="Each practice area has its own page setting out the matters we handle, how the work is sequenced, the courts, tribunals and regulators involved, and the questions clients ask most often."
        trail={[{ label: "Home", href: "/" }, { label: "Services" }]}
      />

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="space-y-16">
          {practiceGroups.map((group) => (
            <section key={group}>
              <div className="flex items-baseline gap-4 border-b border-line-strong pb-4">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                  {group}
                </h2>
                <span className="text-xs uppercase tracking-[0.14em] text-slate-light">
                  {practiceAreasByGroup(group).length} practice
                  {practiceAreasByGroup(group).length === 1 ? "" : "s"}
                </span>
              </div>

              <ul className="mt-8 grid gap-5 lg:grid-cols-2">
                {practiceAreasByGroup(group).map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/services/${area.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-line bg-paper p-7 transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg hover:shadow-ink/5"
                    >
                      <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ink transition group-hover:text-gold-deep">
                        {area.name}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate">
                        {area.tagline}
                      </p>

                      <ul className="mt-5 flex flex-1 flex-wrap gap-2">
                        {area.services.slice(0, 4).map((service) => (
                          <li
                            key={service.title}
                            className="rounded-full bg-paper-tint px-3 py-1 text-xs text-ink-soft"
                          >
                            {service.title}
                          </li>
                        ))}
                        {area.services.length > 4 && (
                          <li className="rounded-full px-2 py-1 text-xs text-slate-light">
                            +{area.services.length - 4} more
                          </li>
                        )}
                      </ul>

                      <span
                        aria-hidden="true"
                        className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep"
                      >
                        View practice
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
          ))}
        </div>
      </div>

      <CtaBand />
    </>
  );
}
