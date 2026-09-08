import { firm, offices, practiceAreas, stats, values } from "@/lib/content";

function ScalesMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 7v18M10 25h12M7 11h18M7 11l-3 7h6zM25 11l-3 7h6z" />
      <circle cx="16" cy="6" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <div className="mt-4 h-px w-16 bg-gold" />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-ink-line/80 bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <ScalesMark className="h-7 w-7 shrink-0 text-gold" />
            <span className="text-sm font-semibold tracking-tight sm:text-base">{firm.name}</span>
          </div>
          <a
            href={firm.phoneHref}
            className="rounded-full border border-gold/40 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold hover:text-ink sm:text-sm"
          >
            {firm.phone}
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-ink-line">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-14rem] h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]"
          />
          <div className="relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28">
            <p className="rise inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
              Going live soon
            </p>

            <div className="rise mt-10 flex justify-center" style={{ animationDelay: "80ms" }}>
              <div className="rounded-2xl border border-gold/25 bg-ink-soft p-5">
                <ScalesMark className="h-12 w-12 text-gold" />
              </div>
            </div>

            <h1
              className="rise mt-8 text-4xl font-semibold tracking-tight sm:text-6xl"
              style={{ animationDelay: "140ms" }}
            >
              {firm.name}
            </h1>
            <p
              className="rise mx-auto mt-5 max-w-2xl text-balance text-lg text-muted sm:text-xl"
              style={{ animationDelay: "200ms" }}
            >
              {firm.tagline}
            </p>
            <p
              className="rise mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted"
              style={{ animationDelay: "260ms" }}
            >
              Our full website is being prepared. In the meantime, here is a brief look at the firm
              &mdash; and you can reach us directly today.
            </p>

            <div
              className="rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "320ms" }}
            >
              <a
                href={firm.phoneHref}
                className="w-full rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink transition hover:bg-gold-deep sm:w-auto"
              >
                Call {firm.phone}
              </a>
              <a
                href="#practice"
                className="w-full rounded-full border border-ink-line px-7 py-3 text-sm font-semibold text-parchment transition hover:border-gold/50 hover:text-gold sm:w-auto"
              >
                Explore practice areas
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-ink-line bg-ink-soft">
          <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-ink-line px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map((stat) => (
              <div key={stat.label} className="px-2 py-8 text-center">
                <div className="text-4xl font-semibold text-gold">{stat.value}</div>
                <div className="mt-2 text-sm text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Overview */}
        <section id="about" className="border-b border-ink-line">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="Overview" title="A firm built on regional depth" />
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <p className="text-lg leading-relaxed text-muted">{firm.overview}</p>
              <div className="space-y-5 border-l border-ink-line pl-6 text-sm leading-relaxed text-muted">
                <p>
                  With a team of highly skilled legal professionals and extensive industry
                  expertise, the firm delivers precise, strategic and time-sensitive legal counsel.
                </p>
                <p>
                  We help corporate clients stay compliant with evolving legal frameworks while
                  navigating complex regulatory and contractual landscapes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Practice areas */}
        <section id="practice" className="border-b border-ink-line bg-ink-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="What we do" title="Practice areas" />
            <div className="grid gap-px overflow-hidden rounded-xl border border-ink-line bg-ink-line sm:grid-cols-2 lg:grid-cols-3">
              {practiceAreas.map((area) => (
                <article key={area.title} className="group bg-ink p-6 transition hover:bg-ink-soft">
                  <h3 className="text-base font-semibold tracking-tight transition group-hover:text-gold">
                    {area.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{area.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-b border-ink-line">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="How we work" title="Core values" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <div key={value.title}>
                  <div className="text-xs font-semibold tabular-nums text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3 text-base font-semibold tracking-tight">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Offices */}
        <section id="offices" className="border-b border-ink-line bg-ink-soft">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <SectionHeading eyebrow="Find us" title="Our offices" />
            <div className="grid gap-6 md:grid-cols-3">
              {offices.map((office) => (
                <address
                  key={office.city}
                  className="rounded-xl border border-ink-line bg-ink p-6 not-italic transition hover:border-gold/40"
                >
                  <h3 className="text-lg font-semibold tracking-tight">{office.city}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                    {office.state}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {office.address.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                  <a
                    href={firm.phoneHref}
                    className="mt-5 inline-block text-sm font-semibold text-gold hover:underline"
                  >
                    {firm.phone}
                  </a>
                </address>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The full site is on its way
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted">
            Until then, our team is available for consultations across Andhra Pradesh, Karnataka and
            Telangana.
          </p>
          <a
            href={firm.phoneHref}
            className="mt-8 inline-block rounded-full bg-gold px-8 py-3 text-sm font-semibold text-ink transition hover:bg-gold-deep"
          >
            Speak with our team
          </a>
        </section>
      </main>

      <footer className="border-t border-ink-line bg-ink-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <ScalesMark className="h-6 w-6 text-gold" />
            <div>
              <div className="text-sm font-semibold">{firm.name}</div>
              <div className="text-xs text-muted">
                {firm.years} years of legal excellence in South India
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} {firm.name}. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
