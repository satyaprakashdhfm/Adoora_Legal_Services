import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { EnquiryForm } from "@/components/enquiry-form";
import { firm, offices } from "@/content/firm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact ADOORA Legal Services — offices in Hyderabad, Amaravati and Bengaluru. Send a brief description of your matter and we will route it to the right person.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Request information"
        lead="Tell us briefly what the matter concerns and we will point you to the right person in the firm. This form is for information requests; it is not an offer of legal services and sending it does not create a lawyer–client relationship."
        trail={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
      />

      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Send an enquiry
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-slate">
              {firm.responseTime} We run a conflicts check before responding
              substantively, and will tell you promptly if we are unable to act.
            </p>
            <div className="mt-8">
              <EnquiryForm />
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-line bg-paper-warm p-7">
              <h2 className="eyebrow text-gold-deep">Direct</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-light">
                    Telephone
                  </p>
                  <a
                    href={firm.phoneHref}
                    className="mt-1 block font-serif text-xl font-semibold text-ink transition hover:text-gold-deep"
                  >
                    {firm.phone}
                  </a>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-light">
                    Email
                  </p>
                  <a
                    href={firm.emailHref}
                    className="mt-1 block break-all font-medium text-ink transition hover:text-gold-deep"
                  >
                    {firm.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line p-7">
              <h2 className="eyebrow text-gold-deep">Offices</h2>
              <ul className="mt-5 space-y-6">
                {offices.map((office) => (
                  <li key={office.city} className="border-l-2 border-gold/25 pl-5">
                    <h3 className="font-serif text-lg font-semibold text-ink">
                      {office.city}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.14em] text-gold-deep">
                      {office.label}
                    </p>
                    <address className="mt-2 space-y-0.5 text-sm not-italic text-slate">
                      {office.lines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </address>
                    <div className="mt-2.5 flex flex-col gap-0.5 text-sm">
                      <a
                        href={office.phoneHref}
                        className="text-ink-soft transition hover:text-gold-deep"
                      >
                        {office.phone}
                      </a>
                      <a
                        href={`mailto:${office.email}`}
                        className="break-all text-ink-soft transition hover:text-gold-deep"
                      >
                        {office.email}
                      </a>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${office.lines.join(", ")}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-gold-deep"
                    >
                      Open in maps
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-ink p-7 text-white/70">
              <h2 className="eyebrow text-gold-bright">Before you write</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed">
                <li>
                  Sending an enquiry does not create a lawyer&ndash;client
                  relationship, and the information is not privileged until we
                  confirm an engagement in writing.
                </li>
                <li>
                  Please do not attach or paste confidential case documents at
                  this stage. Once we can act, we will give you a secure route.
                </li>
                <li>
                  If you are already represented, tell us — it affects the
                  conflicts position.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
