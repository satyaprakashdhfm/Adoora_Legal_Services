import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/ui";
import { ApplyDialog } from "@/components/apply-dialog";
import { roles as staticRoles, speculativeRole } from "@/content/careers";
import { getJobs, type Job } from "@/lib/website-data";
import { practiceAreaBySlug } from "@/content/practice-areas";

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

function formatDay(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** The listing line under a role's title: type, location, experience, closing date. */
function jobMeta(job: Job) {
  return [
    job.employmentType,
    job.location,
    job.experience,
    job.practiceArea ? practiceAreaBySlug.get(job.practiceArea)?.name : null,
    job.closesOn ? `Apply by ${formatDay(job.closesOn)}` : null,
  ].filter(Boolean);
}

/**
 * Roles are posted from the admin console (Website → Job openings). If the
 * API cannot be reached the page falls back to the roles bundled in
 * careers.ts rather than claiming there are none.
 */
export default async function CareersPage() {
  const live = await getJobs();
  const jobs: Job[] =
    live ??
    staticRoles.map((role) => ({
      slug: role.slug,
      title: role.title,
      summary: role.detail,
      practiceArea: null,
      location: null,
      employmentType: "Full-time",
      experience: null,
      responsibilities: [],
      requirements: [],
      closesOn: null,
      publishedAt: null,
    }));

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

          {jobs.length === 0 ? (
            <p className="mt-10 max-w-2xl rounded-2xl border border-line bg-paper p-6 text-sm leading-relaxed text-ink-soft sm:p-7">
              There are no open vacancies at the moment. New roles are listed
              here as they open.
            </p>
          ) : (
            <ul className="mt-12 space-y-4">
              {jobs.map((job) => {
                const meta = jobMeta(job);
                const details = job.responsibilities.length > 0 || job.requirements.length > 0;
                return (
                  <li
                    key={job.slug}
                    className="rounded-2xl border border-line bg-paper p-6 sm:p-7"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                      <div>
                        <h3 className="font-serif text-lg font-semibold tracking-tight text-ink sm:text-xl">
                          {job.title}
                        </h3>
                        {meta.length > 0 && (
                          <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                            {meta.join(" · ")}
                          </p>
                        )}
                        <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                          {job.summary}
                        </p>
                      </div>

                      <ApplyDialog
                        role={job.title}
                        className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink-mid"
                      >
                        Apply
                        <ArrowIcon className="text-gold-bright" />
                      </ApplyDialog>
                    </div>

                    {details && (
                      <details className="group mt-5 border-t border-line pt-4">
                        <summary className="cursor-pointer list-none text-sm font-semibold text-gold-deep">
                          <span className="group-open:hidden">Responsibilities and requirements</span>
                          <span className="hidden group-open:inline">Hide details</span>
                        </summary>
                        <div className="mt-4 grid gap-6 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
                          {[
                            { heading: "What you will do", items: job.responsibilities },
                            { heading: "What we look for", items: job.requirements },
                          ]
                            .filter((block) => block.items.length > 0)
                            .map((block) => (
                              <div key={block.heading}>
                                <p className="font-semibold text-ink">{block.heading}</p>
                                <ul className="mt-2 space-y-1.5">
                                  {block.items.map((item) => (
                                    <li key={item} className="flex gap-2.5">
                                      <span aria-hidden="true" className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-8 text-sm text-ink-soft">
            {jobs.length === 0 ? "You can still send a" : "If none of these fit but you think the firm is right for you, send a"}{" "}
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
