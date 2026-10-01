import Link from "next/link";
import type { Metadata } from "next";
import { PageHero, SectionHeading } from "@/components/ui";
import { firm } from "@/content/firm";
import { titleCase } from "@/lib/title-case";

export const metadata: Metadata = {
  title: "Pro Bono & Community",
  description:
    "Pro bono legal aid, legal awareness camps, support for NGOs and work with legal services authorities and law schools, from ADOORA Legal Services.",
  alternates: { canonical: "/community" },
};

/*
 * The firm's pro bono and community work, and how an organisation can work
 * with it. The copy describes the kinds of work and partner the firm is open
 * to; it names no partner organisation, because none has been confirmed.
 * Add named partners here once the firm has agreed to list them.
 */

const work = [
  {
    title: "Legal aid for individuals",
    body: "Advice and representation for people who qualify for free legal aid: women and children, senior citizens, persons with disabilities, workers, people in custody and families on low incomes. Many of these matters reach us through referrals from legal services authorities.",
  },
  {
    title: "Legal awareness camps",
    body: "Plain-language sessions in schools, colleges, villages and workplaces on the questions people meet most often: tenancy, consumer complaints, workplace rights, protection from domestic violence, and how to ask for free legal aid.",
  },
  {
    title: "Support for NGOs and non-profits",
    body: "Setting up a trust, society or Section 8 company, registration under Sections 12A and 80G of the Income Tax Act, FCRA compliance, and the contracts and governance documents a growing organisation needs.",
  },
  {
    title: "Lok Adalats and mediation",
    body: "Helping parties settle disputes through Lok Adalats and mediation, where a matter can close sooner and an award of a Lok Adalat carries no court fee.",
  },
  {
    title: "Mentoring law students",
    body: "Internships, research guidance and moot court support for law students, with a particular eye to students from colleges outside the larger cities.",
  },
  {
    title: "Help after emergencies",
    body: "Replacing lost documents, insurance claims and compensation applications for families affected by floods, accidents and other emergencies.",
  },
];

const partners = [
  {
    title: "Legal services authorities",
    body: "District and State Legal Services Authorities, and the legal aid panels and Lok Adalats they run.",
  },
  {
    title: "NGOs and community groups",
    body: "Organisations working with women, children, workers, senior citizens and persons with disabilities.",
  },
  {
    title: "Law schools and legal aid clinics",
    body: "Clinics run by law colleges, and student programmes that take legal awareness into the community.",
  },
  {
    title: "Companies with community programmes",
    body: "Businesses that want legal awareness or legal aid to be part of the work they do in their communities.",
  },
  {
    title: "Welfare associations",
    body: "Resident, worker and farmer associations that want their members to understand their rights.",
  },
];

const steps = [
  {
    title: "Tell us about the need",
    body: "Write to us with what your organisation does, who it serves and the kind of legal help that would make a difference.",
  },
  {
    title: "Agree the scope",
    body: "We agree what we will take on, who from the firm will lead it, and how matters or sessions will be referred to us.",
  },
  {
    title: "Review it together",
    body: "We look back at the arrangement at regular intervals and adjust it to what is working.",
  },
];

/* The two light grounds the home page's approach cards use. */
const grounds = ["bg-mist border-mist-line", "bg-paper-warm border-line"];

export default function CommunityPage() {
  return (
    <>
      <PageHero
        eyebrow="Pro bono"
        title="Pro bono & community"
        lead="Part of our time goes to people and organisations that need legal help and cannot pay full fees for it. This page sets out the work we take on and how an organisation can work with us."
        trail={[{ label: "Home", href: "/" }, { label: "Community" }]}
      />

      {/* Why: the Bar Council's own rule. */}
      <section className="container-page py-12 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeading eyebrow="Why we do it" title="Access to justice is part of the job" />
          <div className="space-y-4 leading-relaxed text-ink-soft lg:pt-10 lg:text-[1.0625rem]">
            <p>
              Rule 46 of the Bar Council of India Rules asks every advocate to
              remember that anyone genuinely in need of a lawyer is entitled to
              legal assistance, even if they cannot pay for it fully, and it
              counts free legal help for people who are poor or oppressed among
              the highest obligations an advocate owes to society.
            </p>
            <p>
              The Legal Services Authorities Act, 1987 built a national system
              of free legal aid and Lok Adalats around the same idea. Our pro
              bono work sits alongside that system: we take referrals, run
              awareness sessions and help the organisations that do this work
              every day.
            </p>
          </div>
        </div>
      </section>

      {/* What we do. */}
      <section className="border-y border-line bg-paper-warm">
        <div className="container-page py-12 sm:py-14">
          <SectionHeading eyebrow="What we do" title="How we help" />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {work.map((item, index) => (
              <li key={item.title} className={`rounded-2xl border p-6 sm:p-7 ${grounds[index % 2]}`}>
                <span className="flex items-center gap-3 font-serif text-lg font-semibold text-gold-deep">
                  {String(index + 1).padStart(2, "0")}
                  <span aria-hidden="true" className="h-px w-8 bg-gold/50" />
                </span>
                <h3 className="mt-4 font-serif text-xl font-semibold leading-snug tracking-tight text-ink">
                  {titleCase(item.title)}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Who we work with. */}
      <section className="container-page py-12 sm:py-14">
        <SectionHeading
          eyebrow="Tie-ups"
          title="Organisations we work with"
          lead="We are open to working with organisations of these kinds. Every matter goes through the same conflict check as any other, and we take work on as our capacity allows."
        />
        <ul className="mt-8 grid gap-x-10 gap-y-6 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span aria-hidden="true" className="mt-2 h-px w-6 shrink-0 bg-gold" />
              <div>
                <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">
                  {titleCase(item.title)}
                </h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* How a tie-up works, and the way in. */}
      <section className="border-t border-line bg-paper-warm">
        <div className="container-page grid gap-10 py-12 sm:py-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionHeading eyebrow="Working together" title="How a tie-up works" />
            <ol className="mt-8 space-y-6">
              {steps.map((step, index) => (
                <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4">
                  <span aria-hidden="true" className="font-serif text-2xl font-semibold text-gold/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-semibold tracking-tight text-ink">
                      {titleCase(step.title)}
                    </h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-mist-line bg-mist p-7 sm:p-9">
            <h2 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
              Work With Us on a Cause
            </h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              If your organisation needs legal support for the people it
              serves, tell us about it. {firm.responseTime}
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 self-start rounded-md bg-gold px-6 py-3 text-sm font-semibold text-ink-deep transition hover:bg-gold-bright"
            >
              Contact us
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
