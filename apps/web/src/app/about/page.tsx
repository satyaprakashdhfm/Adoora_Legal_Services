import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/ui";
import {
  firm,
  firmOverview,
  coreValues,
  coverage,
  industryFocus,
  offices,
  stats,
} from "@/content/firm";
import { people, peopleByGroup } from "@/content/people";
import { PersonCard } from "@/components/person-card";
import { practiceAreaBySlug } from "@/content/practice-areas";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "ADOORA Legal Services — the firm's story, its approach to client work, its governance and compliance position, and profiles of the lawyers who lead each practice.",
  alternates: { canonical: "/about" },
};

const rosters = [
  { heading: "Leadership & advocates", members: peopleByGroup("legal") },
  {
    heading: "Business development & corporate relations",
    members: peopleByGroup("business"),
  },
].filter((roster) => roster.members.length > 0);

/** Only people with a bio earn a long-form card beneath the roster. */
const profiled = people.filter((person) => person.bio?.length);

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="A practice organised around the whole of a matter"
        lead={firm.descriptor}
        trail={[{ label: "Home", href: "/" }, { label: "About Us" }]}
      />

      {/* Overview and core values, as the brochure sets them out. Replaced
          the firm's origin story, which the brochure does not carry. */}
      <section className="container-page py-12 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.5fr] lg:gap-12">
          <div>
            <SectionHeading eyebrow="Overview" title="Who we are" />
            <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">
              {firmOverview.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div>
            <h2 className="eyebrow inline-flex items-center gap-2.5 text-gold-deep">
              <span aria-hidden="true" className="h-px w-8 bg-gold/50" />
              Core values
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              {coreValues.intro}
            </p>

            <div className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {coreValues.values.map((value) => (
                <div key={value.title} className="border-t border-line pt-4">
                  <h3 className="font-serif text-base font-semibold text-ink">
                    {value.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {value.body}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 font-serif text-sm italic leading-relaxed text-slate">
              {coreValues.close}
            </p>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-12 sm:py-14">
          <SectionHeading eyebrow="Our approach" title="Key strengths" />

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Regional Expertise",
                body: "Extensive knowledge of legal and regulatory frameworks across Andhra Pradesh, Karnataka and Telangana, ensuring precise jurisdictional compliance.",
              },
              {
                title: "Strategic Legal Solutions",
                body: "Tailored legal counsel designed to mitigate risks, ensure regulatory adherence and address industry-specific challenges.",
              },
              {
                title: "Proven Legal Expertise",
                body: "A highly skilled team of attorneys and legal professionals with extensive experience in corporate law, dispute resolution and compliance.",
              },
              {
                title: "Client-Focused Advocacy",
                body: "Dedicated to safeguarding clients' interests through proactive legal representation, strategic advisory and result-oriented solutions.",
              },
            ].map((item, index) => (
              <li
                key={item.title}
                className="rounded-xl border border-line bg-paper p-6"
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-2xl font-semibold text-gold/40"
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

          <div className="mt-10 grid grid-cols-2 gap-y-6 border-t border-line-strong pt-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-3xl font-semibold text-ink">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs uppercase tracking-[0.14em] text-slate">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Governance & compliance */}
      <section className="container-page py-12 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.5fr] lg:gap-12">
          <SectionHeading
            eyebrow="Governance & compliance"
            title="How we operate within the professional rules"
          />
          <div className="space-y-5 leading-relaxed text-ink-soft">
            <p>
              The firm and its advocates are governed by the Advocates Act, 1961
              and the Bar Council of India Rules, including the Standards of
              Professional Conduct and Etiquette. Advocates in India are not
              permitted to solicit work or advertise, and this website is
              accordingly informational: it carries no testimonials, no claims
              to be the best or leading firm in any field, and no representation
              about the outcome of any matter.
            </p>
            <p>
              We run a conflicts check before accepting any new instruction and
              will decline promptly where we cannot act. Client information is
              treated as confidential and privileged, and access within the firm
              is limited to those working on the matter. Fee arrangements are
              confirmed in writing at the outset, with an estimate broken down
              by stage.
            </p>
            <p>
              Personal data submitted through this website is handled in
              accordance with our{" "}
              <Link
                href="/privacy"
                className="text-gold-deep underline decoration-gold/30 underline-offset-4"
              >
                Privacy Policy
              </Link>{" "}
              and the Digital Personal Data Protection Act, 2023. Nothing on
              this website creates a lawyer&ndash;client relationship, and
              information sent through the enquiry form is not privileged until
              we have confirmed an engagement.
            </p>
          </div>
        </div>
      </section>

      {/* People */}
      {/* The brochure supplies names and designations only, so this renders as
          a roster. Anyone given a `bio` in people.ts is promoted to the
          long-form profile card beneath it. */}
      <section id="people" className="border-y border-line bg-paper-warm">
        <div className="container-page py-12 sm:py-14">
          <SectionHeading
            eyebrow="Our people"
            title="The lawyers who lead each practice"
            lead="An efficient team of hardworking, sincere and talented professionals working across South India, from our offices in Telangana, Karnataka and Andhra Pradesh."
          />

          {rosters.map((roster) => (
            <div key={roster.heading} className="mt-10">
              <h3 className="eyebrow border-b border-line-strong pb-4 text-ink">
                {roster.heading}
              </h3>

              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roster.members.map((person) => (
                  <li key={person.slug} id={person.slug} className="scroll-mt-32">
                    <PersonCard person={person} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {profiled.length > 0 && (
            <div className="mt-12 space-y-5">
              {profiled.map((person) => (
                <article
                  key={person.slug}
                  id={`${person.slug}-profile`}
                  className="scroll-mt-32 rounded-2xl border border-line bg-paper p-6 sm:p-7"
                >
                  <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:gap-10">
                    <div>
                      <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                        {person.name}
                      </h3>
                      <p className="mt-1 text-sm text-gold-deep">
                        {person.designation}
                      </p>

                      <dl className="mt-5 space-y-2.5 text-sm">
                        {person.office && (
                          <div>
                            <dt className="text-xs uppercase tracking-[0.14em] text-slate-light">
                              Office
                            </dt>
                            <dd className="text-ink-soft">{person.office}</dd>
                          </div>
                        )}
                        {person.experience && (
                          <div>
                            <dt className="text-xs uppercase tracking-[0.14em] text-slate-light">
                              Experience
                            </dt>
                            <dd className="text-ink-soft">{person.experience}</dd>
                          </div>
                        )}
                        {/* Enrolment details render only once the firm supplies
                            them — see the note at the top of people.ts. */}
                        {person.enrolment && person.stateBar && (
                          <div>
                            <dt className="text-xs uppercase tracking-[0.14em] text-slate-light">
                              Enrolment
                            </dt>
                            <dd className="text-ink-soft">
                              {person.enrolment} &middot; {person.stateBar}
                              {person.enrolledSince
                                ? ` · ${person.enrolledSince}`
                                : ""}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div>
                      <div className="space-y-4 leading-relaxed text-ink-soft">
                        {person.bio?.map((paragraph) => (
                          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                        ))}
                      </div>

                      <div className="mt-7 grid gap-7 sm:grid-cols-2">
                        {person.practices?.length ? (
                          <div>
                            <h4 className="eyebrow text-slate-light">Practices</h4>
                            <ul className="mt-3 flex flex-wrap gap-2">
                              {person.practices.map((practiceSlug) => {
                                const practice =
                                  practiceAreaBySlug.get(practiceSlug);
                                if (!practice) return null;

                                return (
                                  <li key={practiceSlug}>
                                    <Link
                                      href={`/services/${practice.slug}`}
                                      className="inline-block rounded-full border border-line px-3 py-1 text-xs text-ink-soft transition hover:border-gold hover:text-gold-deep"
                                    >
                                      {practice.shortName}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}

                        {person.education?.length ? (
                          <div>
                            <h4 className="eyebrow text-slate-light">Education</h4>
                            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                              {person.education.map((entry) => (
                                <li key={entry}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {person.publications?.length ? (
                          <div>
                            <h4 className="eyebrow text-slate-light">
                              Publications &amp; speaking
                            </h4>
                            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                              {person.publications.map((entry) => (
                                <li key={entry}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {person.memberships?.length ? (
                          <div>
                            <h4 className="eyebrow text-slate-light">Memberships</h4>
                            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                              {person.memberships.map((entry) => (
                                <li key={entry}>{entry}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Geographical coverage and industry focus, the brochure's framing of
          the offices — the addresses were already here under a bare heading. */}
      <section className="container-page py-12 sm:py-14">
        <div className="grid gap-9 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Geographical coverage"
              title="Where to find us"
              lead={coverage.close}
            />

            <ul className="mt-7 grid gap-4 sm:grid-cols-3">
              {offices.map((office) => (
                <li
                  key={office.city}
                  className="rounded-xl border border-line bg-paper-warm p-5"
                >
                  <h3 className="font-serif text-base font-semibold text-ink">
                    {office.city}
                  </h3>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] text-gold-deep">
                    {office.label}
                  </p>
                  <address className="mt-2.5 space-y-0.5 text-[0.8rem] not-italic leading-relaxed text-ink-soft">
                    {office.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </address>
                  <a
                    href={office.phoneHref}
                    className="mt-3 inline-block text-[0.8rem] text-ink-soft transition hover:text-gold-deep"
                  >
                    {office.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow inline-flex items-center gap-2.5 text-gold-deep">
              <span aria-hidden="true" className="h-px w-8 bg-gold/50" />
              Industry focus
            </h2>
            <ul className="mt-5">
              {industryFocus.map((sector) => (
                <li
                  key={sector}
                  className="flex items-center gap-2.5 border-b border-line py-2.5 text-sm text-ink"
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  />
                  {sector}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

    </>
  );
}
