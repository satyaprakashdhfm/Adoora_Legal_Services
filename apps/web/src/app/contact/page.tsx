import Image from "next/image";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { publicImage } from "@/lib/public-image";
import { EnquiryForm } from "@/components/enquiry-form";
import { firm, offices } from "@/content/firm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact ADOORA Legal Services — offices in Hyderabad, Bengaluru and Guntur. Send a brief description of your matter and we will route it to the right person.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  /* The same photograph and wash as the careers panel on the home page, so the
     two calls to action read as one family. */
  const cardImage = publicImage("careers-office");

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Request information"
        lead="Tell us briefly what the matter concerns and we will point you to the right person in the firm. This form is for information requests; it is not an offer of legal services and sending it does not create a lawyer–client relationship."
        trail={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
        tone="light"
      />

      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
          <div className="relative isolate overflow-hidden rounded-2xl bg-ink p-7 text-white sm:p-10">
            {cardImage ? (
              <>
                <Image
                  src={cardImage}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="-z-20 object-cover object-right"
                />
                {/* Heavier than the careers panel's wash: fields run the full
                    width here, so the photograph can only show at the edge. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-ink)_0%,color-mix(in_oklab,var(--color-ink)_94%,transparent)_55%,color-mix(in_oklab,var(--color-ink)_72%,transparent)_100%)]"
                />
              </>
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--color-ink-mid),var(--color-ink-deep))]"
              />
            )}

            <p className="eyebrow inline-flex items-center gap-2.5 text-gold-bright">
              <span aria-hidden="true" className="h-px w-8 bg-gold-bright/60" />
              Enquiry
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-white">
              Send an enquiry
            </h2>
            <p className="mt-3 max-w-xl leading-relaxed text-white/80">
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
                    <address className="mt-2 space-y-0.5 text-sm not-italic text-ink-soft">
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

            <div className="rounded-2xl border border-line bg-paper-warm p-7 text-ink-soft">
              <h2 className="eyebrow text-gold-deep">Before you write</h2>
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
