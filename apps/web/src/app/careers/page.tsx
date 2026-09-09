import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/ui";
import { CareerForm } from "@/components/career-form";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Open roles at ADOORA Legal Services across our Hyderabad, Amaravati and Bengaluru offices, with eligibility and how to apply.",
  alternates: { canonical: "/careers" },
};

/**
 * Open roles. Replace with the firm's actual vacancies — these describe the
 * shape of the practice rather than confirmed openings, and the firm should
 * confirm each before publication.
 */
const roles = [
  {
    title: "Associate — Corporate & M&A",
    office: "Hyderabad",
    experience: "2–4 years PQE",
    detail:
      "Transaction work across acquisitions, private equity investments and joint ventures. You will run legal due diligence workstreams, draft transaction documents under supervision, and manage regulatory filings.",
    eligibility: [
      "Enrolled with a State Bar Council",
      "Two to four years in a corporate practice, in-house or private practice",
      "Experience of legal due diligence and drafting transaction documents",
    ],
  },
  {
    title: "Associate — Dispute Resolution",
    office: "Hyderabad",
    experience: "2–5 years PQE",
    detail:
      "Commercial litigation and arbitration. Drafting pleadings and interim applications, briefing and appearing in the district judiciary and tribunals, and assisting on High Court matters.",
    eligibility: [
      "Enrolled with a State Bar Council",
      "Independent drafting experience and comfort appearing before a court or tribunal",
      "Working knowledge of the Arbitration and Conciliation Act, 1996",
    ],
  },
  {
    title: "Associate — Real Estate",
    office: "Amaravati",
    experience: "1–3 years PQE",
    detail:
      "Title investigation, development documentation and RERA compliance. You will trace chains of title, prepare title reports, and draft acquisition and development documents.",
    eligibility: [
      "Enrolled with a State Bar Council",
      "Reading knowledge of Telugu is a significant advantage for revenue records",
      "Familiarity with registration and stamp duty practice",
    ],
  },
  {
    title: "Associate — Technology & Data Protection",
    office: "Bengaluru",
    experience: "1–4 years PQE",
    detail:
      "Technology contracting and data protection advisory. SaaS and cloud agreements, DPDP readiness work, and platform regulation questions.",
    eligibility: [
      "Enrolled with a State Bar Council",
      "Experience of technology contracting or privacy compliance",
      "Ability to work directly with product and engineering teams",
    ],
  },
  {
    title: "Legal Intern",
    office: "Hyderabad, Amaravati or Bengaluru",
    experience: "3rd, 4th or 5th year students",
    detail:
      "Six to eight week internships across practices. Research, drafting support and hearing attendance, with a written assessment at the end.",
    eligibility: [
      "Enrolled in a three or five year LL.B. programme",
      "Applications at least two months before the intended start date",
    ],
  },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Work with us"
        lead="We look for lawyers who want responsibility early and are willing to learn a matter properly before forming a view. Roles are listed with the eligibility and the practice they sit in."
        trail={[{ label: "Home", href: "/" }, { label: "Careers" }]}
      />

      {/* Culture */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
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

      {/* Roles */}
      <section className="border-y border-line bg-paper-warm">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            eyebrow="Open roles"
            title="Current vacancies"
            lead="If none of these fit but you think the firm is right for you, send a speculative application."
          />

          <ul className="mt-12 space-y-5">
            {roles.map((role) => (
              <li
                key={role.title}
                className="rounded-2xl border border-line bg-paper p-7 sm:p-8"
              >
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
                  <div>
                    <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                      {role.title}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.14em] text-gold">
                      <span>{role.office}</span>
                      <span className="text-slate-light">
                        {role.experience}
                      </span>
                    </div>
                    <p className="mt-4 leading-relaxed text-ink-soft">
                      {role.detail}
                    </p>
                  </div>

                  <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                    <h4 className="eyebrow text-slate-light">Eligibility</h4>
                    <ul className="mt-3 space-y-2.5">
                      {role.eligibility.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                          />
                          <span className="text-sm leading-relaxed text-slate">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Application */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <SectionHeading
          eyebrow="Apply"
          title="Submit an application"
          lead="Complete the form and email your CV to careers@adooralegalservices.com quoting the role."
        />
        <div className="mt-10">
          <CareerForm roles={roles.map((role) => role.title)} />
        </div>
      </section>
    </>
  );
}
