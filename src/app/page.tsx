import { firm } from "@/lib/content";

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

export default function Home() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[56rem] -translate-x-1/2 rounded-full bg-gold/10 blur-[130px]"
      />

      <section className="relative w-full max-w-xl text-center">
        <p className="rise inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-gold" />
          Coming soon
        </p>

        <div className="rise mt-10 flex justify-center" style={{ animationDelay: "80ms" }}>
          <div className="rounded-2xl border border-gold/25 bg-ink-soft p-5">
            <ScalesMark className="h-12 w-12 text-gold" />
          </div>
        </div>

        <h1
          className="rise mt-8 text-4xl font-semibold tracking-tight sm:text-5xl"
          style={{ animationDelay: "140ms" }}
        >
          {firm.name}
        </h1>

        <p
          className="rise mt-5 text-balance text-lg text-muted"
          style={{ animationDelay: "200ms" }}
        >
          {firm.tagline}
        </p>

        <p
          className="rise mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold/80"
          style={{ animationDelay: "240ms" }}
        >
          {firm.regions}
        </p>

        <p
          className="rise mx-auto mt-8 max-w-md text-sm leading-relaxed text-muted"
          style={{ animationDelay: "300ms" }}
        >
          Our new website is on its way. In the meantime, our team is available &mdash; please get in
          touch.
        </p>

        <div
          className="rise mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "360ms" }}
        >
          <a
            href={firm.phoneHref}
            className="w-full rounded-full bg-gold px-7 py-3 text-sm font-semibold text-ink transition hover:bg-gold-deep sm:w-auto"
          >
            {firm.phone}
          </a>
          <a
            href={firm.emailHref}
            className="w-full rounded-full border border-ink-line px-7 py-3 text-sm font-semibold text-parchment transition hover:border-gold/50 hover:text-gold sm:w-auto"
          >
            {firm.email}
          </a>
        </div>

        <p
          className="rise mt-14 text-xs text-muted"
          style={{ animationDelay: "420ms" }}
        >
          &copy; {new Date().getFullYear()} {firm.name}. All rights reserved.
        </p>
      </section>
    </main>
  );
}
