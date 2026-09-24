import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/ui";
import { ApplyDialog } from "@/components/apply-dialog";
import { roles, speculativeRole } from "@/content/careers";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Open roles at ADOORA Legal Services across our Hyderabad, Bengaluru and Guntur offices, with eligibility and how to apply.",
  alternates: { canonical: "/careers" },
};

function ArrowIcon({ className = "" }: { className?: string }) {
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

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Work with us"
        lead="We look for lawyers who want responsibility early and are willing to learn a matter properly before forming a view. Roles are listed with the eligibility and the practice they sit in."
        trail={[{ label: "Home", href: "/" }, { label: "Careers" }]}
        image
      />

      {/* Culture */}
      <section className="container-page py-12 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.5fr] lg:gap-12">
          <SectionHeading
            eyebrow="Working here"
            title="What the work is actually like"
          />
          <div className="space-y-5 leading-relaxed text-ink-soft">
            <p>
              Teams are small, which means associates are on matters rather than
              adjacent to them. You will be in the client call, not reading the
              note afterwards. That is the main thing we offer, and it is also
              the main demand — the work assumes you will get to grips with the
              commercial context, not only the legal question.
            </p>
            <p>
              We are candid in review. Drafting comes back marked up, and the
              reasoning behind each change is explained. Lawyers who want to
              improve quickly tend to find that useful; it is worth knowing in
              advance that it is how the firm works.
            </p>
            <p>
              Because practices overlap, you will see how a corporate matter
              becomes an employment question or a dispute. Associates who want
              to specialise can, but not before spending time across the areas
              that touch their own.
            </p>
          </div>
        </div>
      </section>

      {/* Roles — title, a short description, and an Apply button that opens
          the application form for that role in a popup. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-12 sm:py-14">
          <SectionHeading
            eyebrow="Open roles"
            title="Current vacancies"
          />

          <ul className="mt-12 space-y-4">
            {roles.map((role) => (
              <li
                key={role.slug}
                className="flex flex-col gap-5 rounded-2xl border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7"
              >
                <div>
                  <h3 className="font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">
                    {role.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                    {role.detail}
                  </p>
                </div>

                <ApplyDialog
                  role={role.title}
                  className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-mid sm:self-auto"
                >
                  Apply
                  <ArrowIcon className="text-gold-bright" />
                </ApplyDialog>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-ink-soft">
            If none of these fit but you think the firm is right for you, send
            a{" "}
            <ApplyDialog
              role={speculativeRole.title}
              className="font-semibold text-gold-deep underline decoration-gold/40 underline-offset-4 transition hover:decoration-gold"
            >
              speculative application
            </ApplyDialog>
            .
          </p>
        </div>
      </section>
    </>
  );
}
