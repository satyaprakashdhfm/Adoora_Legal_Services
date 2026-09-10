import Link from "next/link";
import type { Metadata } from "next";
import { CtaBand, PageHero, SectionHeading } from "@/components/ui";
import { firm, offices, stats } from "@/content/firm";
import { people, peopleByGroup } from "@/content/people";
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

      {/* Story */}
      <section className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <SectionHeading eyebrow="Our story" title="How the firm came together" />
          <div className="space-y-5 leading-relaxed text-ink-soft">
            <p>
              {firm.name} was built by lawyers who had spent years watching
              matters fall between practice areas. A financing would stall on a
              land title question that nobody in the deal team was equipped to
              answer. An acquisition would be repriced late because an
              employment exposure surfaced after the term sheet. A regulatory
              notice would be handled as a compliance item until it became
              litigation.
            </p>
            <p>
              The firm is organised to close those gaps. We keep practice teams
              small and overlapping, so the person who structures a matter is
              still involved when it is tested, and so the corporate, finance,
              employment and disputes views on a problem are formed together
              rather than in sequence.
            </p>
            <p>
              We work from Hyderabad, Bengaluru and Guntur, and appear before
              the courts, tribunals and regulators of Telangana, Andhra Pradesh
              and Karnataka. Our clients include domestic and foreign commercial
              enterprises, banks and financial institutions, private equity and
              venture capital funds, promoter-led and family businesses,
              start-ups, and government and public sector entities.
            </p>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-20">
          <SectionHeading
            eyebrow="Our approach"
            title="Four things we try to do consistently"
          />

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Give the answer, then the reasoning",
                body: "Advice that opens with three pages of context and reaches a view in the last paragraph is not useful to someone who has to decide today. We lead with the position and the risk, and put the analysis behind it.",
              },
              {
                title: "Say when a claim is weak",
                body: "We would rather advise against a matter at assessment than at the hearing. Where the commercial settlement is the better outcome, we say so early, even when that means less work for us.",
              },
              {
                title: "Price the regulatory reality in",
                body: "Structuring, approvals and enforcement are the same question at different stages. We test a structure against the rules it will have to survive before it is drafted, not after.",
              },
              {
                title: "Write documents to be used",
                body: "Diligence reports ranked by deal consequence. Contracts whose operative clauses match their compliance schedules. Advice a non-lawyer in your team can act on.",
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

          <div className="mt-14 grid grid-cols-2 gap-y-8 border-t border-line-strong pt-10 lg:grid-cols-4">
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
      <section className="container-page py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
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
        <div className="container-page py-20">
          <SectionHeading
            eyebrow="Our people"
            title="The lawyers who lead each practice"
            lead="An efficient team of hardworking, sincere and talented professionals working across South India, from our offices in Telangana, Karnataka and Andhra Pradesh."
          />

          {rosters.map((roster) => (
            <div key={roster.heading} className="mt-14">
              <h3 className="eyebrow border-b border-line-strong pb-4 text-ink">
                {roster.heading}
              </h3>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roster.members.map((person) => (
                  <li
                    key={person.slug}
                    id={person.slug}
                    className="flex scroll-mt-32 items-center gap-4 rounded-xl border border-line bg-paper p-5"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper-warm font-serif text-sm font-semibold text-gold-deep"
                    >
                      {person.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="font-serif font-semibold leading-snug tracking-tight text-ink">
                        {person.name}
                      </p>
                      <p className="mt-1 text-sm text-gold-deep">
                        {person.designation}
                        {person.qualification && (
                          <span className="text-slate">
                            {" "}
                            &middot; {person.qualification}
                          </span>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {profiled.length > 0 && (
            <div className="mt-16 space-y-6">
              {profiled.map((person) => (
                <article
                  key={person.slug}
                  id={`${person.slug}-profile`}
                  className="scroll-mt-32 rounded-2xl border border-line bg-paper p-7 sm:p-9"
                >
                  <div className="grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
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

      {/* Offices */}
      <section className="container-page py-20">
        <SectionHeading eyebrow="Offices" title="Where to find us" />
        <ul className="mt-12 grid gap-5 sm:grid-cols-3">
          {offices.map((office) => (
            <li
              key={office.city}
              className="rounded-xl border border-line bg-paper-warm p-6"
            >
              <h3 className="font-serif text-lg font-semibold text-ink">
                {office.city}
              </h3>
              <p className="text-xs uppercase tracking-[0.14em] text-gold-deep">
                {office.label}
              </p>
              <address className="mt-3 space-y-0.5 text-sm not-italic text-ink-soft">
                {office.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
              <div className="mt-4 flex flex-col gap-1 text-sm">
                <a
                  href={office.phoneHref}
                  className="text-ink-soft transition hover:text-gold-deep"
                >
                  {office.phone}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand />
    </>
  );
}
