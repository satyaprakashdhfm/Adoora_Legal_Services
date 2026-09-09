import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { policyBySlug } from "@/content/policies";
import { formatDate } from "@/components/ui";

/** Metadata helper so each policy page stays a three-line file. */
export function policyMetadata(slug: string): Metadata {
  const policy = policyBySlug.get(slug);
  if (!policy) return { title: "Not found" };

  return {
    title: policy.title,
    description: policy.description,
    alternates: { canonical: `/${policy.slug}` },
    // Policy pages carry no firm marketing; index them but keep them out of
    // the way of the substantive pages.
    robots: { index: true, follow: true },
  };
}

/** Shared renderer for the four policy pages. */
export function PolicyPage({ slug }: { slug: string }) {
  const policy = policyBySlug.get(slug);

  if (!policy) notFound();

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={policy.title}
        lead={policy.intro}
        trail={[{ label: "Home", href: "/" }, { label: policy.title }]}
      />

      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="text-sm text-slate-light">
          Last updated {formatDate(policy.updated)}
        </p>

        <div className="mt-10 space-y-12">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="leading-relaxed text-ink-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {section.bullets && (
                <ul className="mt-5 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3.5">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                      />
                      <span className="leading-relaxed text-ink-soft">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
