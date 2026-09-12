import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Faq } from "@/content/types";
import { peopleBySlugs } from "@/content/people";
import type { Insight } from "@/content/insights";
import { InsightArtwork } from "@/components/insight-artwork";

/** Eyebrow + heading + optional lead, used at the top of every section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
}) {
  const isDark = tone === "dark";

  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p
          className={`eyebrow inline-flex items-center gap-2.5 ${
            isDark ? "text-gold-bright" : "text-gold-deep"
          }`}
        >
          <span
            className={`h-px w-8 ${isDark ? "bg-gold-bright/60" : "bg-gold/50"}`}
          />
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl ${
          isDark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={`mt-4 text-base leading-relaxed ${
            isDark ? "text-white/85" : "text-ink-soft"
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

export function Breadcrumbs({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
        {trail.map((crumb, index) => (
          <li key={crumb.label} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-white/30">
                /
              </span>
            )}
            {crumb.href ? (
              <Link href={crumb.href} className="transition hover:text-gold-bright">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-white/80">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Overview prose block — the "Regulatory environment" style sections. */
export function ProseBlock({
  heading,
  body,
}: {
  heading: string;
  body: string[];
}) {
  return (
    <section className="border-t border-line pt-8 first:border-0 first:pt-0">
      <h3 className="font-serif text-2xl font-semibold tracking-tight text-ink">
        {heading}
      </h3>
      <div className="mt-4 space-y-4">
        {body.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="leading-relaxed text-ink-soft">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

/** Numbered list of service sub-categories (the ELP "Services" tab). */
export function ServiceList({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <ol className="space-y-8">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="grid gap-4 border-t border-line pt-8 first:border-0 first:pt-0 sm:grid-cols-[3rem_1fr]"
        >
          <span
            aria-hidden="true"
            className="font-serif text-2xl font-semibold text-gold/40"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
              {item.title}
            </h3>
            <p className="mt-2.5 leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Bulleted factual list — representative matters, forums, regulators. */
export function FactList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item} className="flex gap-3.5">
          <span
            aria-hidden="true"
            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
          />
          <span className="leading-relaxed text-ink-soft">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProcessSteps({
  steps,
}: {
  steps: { stage: string; detail: string }[];
}) {
  return (
    <ol className="relative space-y-8 border-l border-line pl-8">
      {steps.map((step, index) => (
        <li key={step.stage} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[2.4rem] flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-paper text-[0.65rem] font-semibold text-gold-deep"
          >
            {index + 1}
          </span>
          <h3 className="font-semibold text-ink">{step.stage}</h3>
          <p className="mt-1.5 leading-relaxed text-ink-soft">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * FAQ accordion built on native `<details>`. No JavaScript, and the answers
 * stay in the DOM for indexing and for the FAQPage structured data.
 */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((faq) => (
        <details key={faq.q} className="group py-5">
          <summary className="flex cursor-pointer items-start justify-between gap-4 font-medium text-ink marker:content-none [&::-webkit-details-marker]:hidden">
            <span>{faq.q}</span>
            <span
              aria-hidden="true"
              className="mt-1 shrink-0 text-gold-deep transition-transform group-open:rotate-45"
            >
              <svg viewBox="0 0 14 14" className="h-3.5 w-3.5">
                <path
                  d="M7 1v12M1 7h12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </summary>
          <p className="mt-3 max-w-3xl pr-8 leading-relaxed text-ink-soft">
            {faq.a}
          </p>
        </details>
      ))}
    </div>
  );
}

/** Team grid. Initials stand in until the firm supplies photography. */
export function TeamGrid({ slugs }: { slugs: string[] }) {
  const members = peopleBySlugs(slugs);

  if (!members.length) return null;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((person) => (
        <li
          key={person.slug}
          className="rounded-xl border border-line bg-paper-warm p-6"
        >
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-line-strong bg-paper font-serif text-sm font-semibold text-gold-deep"
          >
            {person.initials}
          </span>
          <h3 className="mt-4 font-serif text-lg font-semibold tracking-tight text-ink">
            {person.name}
          </h3>
          <p className="mt-1 text-sm text-gold-deep">{person.designation}</p>
          {(person.office || person.experience) && (
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-light">
              {[person.office, person.experience].filter(Boolean).join(" · ")}
            </p>
          )}
          <Link
            href={`/about#${person.slug}`}
            className="mt-4 inline-block text-sm font-medium text-ink-soft underline decoration-line-strong underline-offset-4 transition hover:text-gold-deep"
          >
            Profile
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-line-strong hover:shadow-lg hover:shadow-ink/5">
      {/* The frame. A real photograph when the article has one, otherwise the
          drawn composition for its subject. */}
      <div className="relative aspect-[16/9] overflow-hidden bg-ink">
        {insight.image && insight.imageFrame ? (
          /* Several articles share one file laid out as a horizontal strip.
             The inner box is as many times the card's width as the strip has
             frames, offset so this article's frame lands in view — `cover` on
             that box, so a frame is cropped rather than squashed. */
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
            style={{
              backgroundImage: `url("${insight.image}")`,
              width: `${insight.imageFrame.frames * 100}%`,
              left: `-${insight.imageFrame.index * 100}%`,
            }}
          />
        ) : insight.image ? (
          <Image
            src={insight.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <InsightArtwork
            artwork={insight.artwork}
            className="h-full w-full transition duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <span className="rounded-full bg-paper-tint px-2.5 py-1 font-medium text-gold-deep">
            {insight.category}
          </span>
          <time dateTime={insight.date} className="text-slate-light">
            {formatDate(insight.date)}
          </time>
        </div>

        <h3 className="mt-4 font-serif text-lg font-semibold leading-snug tracking-tight text-ink">
          <Link href={`/insights/${insight.slug}`} className="transition group-hover:text-gold-deep">
            {/* Stretches the link over the whole card, so the frame and the
                summary are clickable too. */}
            <span aria-hidden="true" className="absolute inset-0" />
            {insight.title}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">
          {insight.summary}
        </p>

        <p className="mt-4 text-xs text-slate-light">{insight.readingTime}</p>
      </div>
    </article>
  );
}

/** Dark page header used by every inner page. */
export function PageHero({
  eyebrow,
  title,
  lead,
  trail,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  trail?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[-14rem] h-[28rem] w-[28rem] rounded-full bg-gold-bright/10 blur-[120px]"
      />
      <div className="container-page relative py-14 sm:py-16">
        {trail && <Breadcrumbs trail={trail} />}
        {eyebrow && (
          <p className="eyebrow mt-6 inline-flex items-center gap-2.5 text-gold-bright">
            <span className="h-px w-8 bg-gold-bright/60" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/85 sm:text-lg">
            {lead}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
