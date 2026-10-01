import Image from "next/image";
import Link from "next/link";
import { titleCase } from "@/lib/title-case";
import type { ReactNode } from "react";
import type { Faq } from "@/content/types";
import type { Person } from "@/content/people";
import type { Insight } from "@/content/insights";
import { InsightArtwork } from "@/components/insight-artwork";
import { anchorFor } from "@/lib/anchor";
import { publicImage, publicImageSize } from "@/lib/public-image";

/** Eyebrow + heading + optional lead, used at the top of every section. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "left",
  size = "default",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  /** "large" for the home page's opening About band. */
  size?: "default" | "large";
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
          {/* A border rather than a 1px-tall box: a border always paints
              at least one device pixel, so the rule can't vanish at
              fractional zoom levels. */}
          <span
            aria-hidden="true"
            className={`w-8 border-t ${isDark ? "border-gold-bright/70" : "border-gold/70"}`}
          />
          {eyebrow}
        </p>
      )}
      <h2
        className={`mt-3 font-serif text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl ${
          size === "large" ? "lg:text-[2.5rem] lg:leading-[1.15]" : ""
        } ${
          isDark ? "text-white" : "text-ink"
        }`}
      >
        {titleCase(title)}
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
  tone = "light",
}: {
  trail: { label: string; href?: string }[];
  tone?: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <nav aria-label="Breadcrumb">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${isDark ? "text-white/70" : "text-slate"}`}>
        {trail.map((crumb, index) => (
          <li key={crumb.label} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className={isDark ? "text-white/30" : "text-line-strong"}>
                /
              </span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className={`transition ${isDark ? "hover:text-gold-bright" : "hover:text-gold-deep"}`}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={isDark ? "text-white" : "text-ink"}>{crumb.label}</span>
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
  basePath,
}: {
  items: { title: string; body: string }[];
  /**
   * When set, each item links to `${basePath}/${anchor}` — its own page. Left
   * unset on the industry pages, whose matter types have no page of their own.
   */
  basePath?: string;
}) {
  return (
    <ol className="space-y-8">
      {items.map((item, index) => {
        const href = basePath ? `${basePath}/${anchorFor(item.title)}` : null;

        return (
          <li
            key={item.title}
            id={anchorFor(item.title)}
            /* Clears the sticky header and the sticky tab strip under it. */
            className="grid scroll-mt-44 gap-4 border-t border-line pt-8 first:border-0 first:pt-0 sm:grid-cols-[3rem_1fr] lg:scroll-mt-56"
          >
            <span
              aria-hidden="true"
              className="font-serif text-2xl font-semibold text-gold/40"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-serif text-xl font-semibold tracking-tight text-ink">
                {href ? (
                  <Link href={href} className="transition hover:text-gold-deep">
                    {titleCase(item.title)}
                  </Link>
                ) : (
                  titleCase(item.title)
                )}
              </h3>
              <p className="mt-2.5 leading-relaxed text-ink-soft">{item.body}</p>
              {href && (
                <Link
                  href={href}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-gold-deep transition hover:text-ink"
                >
                  Read more
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
                    <path
                      d="M2 8h11M9 4l4 4-4 4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </li>
        );
      })}
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
export function TeamGrid({ members }: { members: Person[] }) {
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
  /* Resolved on the server at build time. Nothing client-side imports this
     file; if that changes, resolve the image in the page and pass it down. */
  const image = insight.coverUrl ?? (insight.imageBase ? publicImage(insight.imageBase) : null);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-paper transition hover:border-line-strong hover:shadow-lg hover:shadow-ink/5">
      {/* The frame. A real photograph when the article has one, otherwise the
          drawn composition for its subject. */}
      <div className="relative aspect-[16/9] overflow-hidden bg-ink">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            unoptimized={Boolean(insight.coverUrl)}
            style={insight.imageFocus ? { objectPosition: insight.imageFocus } : undefined}
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
            {titleCase(insight.title)}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">
          {insight.summary}
        </p>

        <p className="mt-auto pt-4 text-xs text-slate-light">{insight.readingTime}</p>
      </div>
    </article>
  );
}

/**
 * Page header used by every inner page, one step down the warm-paper scale
 * from the plain bands (`paper-tint`, not `paper-warm`) so it reads as a
 * distinct band rather than blending into the page. The home page has its
 * own photographic hero; every other page opens here.
 *
 * Every inner page opens on `hero-bg-other` — the blindfolded Lady Justice
 * statue, sepia-toned on a matching pale ground — behind the heading. It is
 * pale enough, and the statue sits far enough to the right, that the heading
 * needs no scrim to stay readable over it. Pass `image={false}` for the
 * plain `paper-tint` band instead.
 *
 * A band with the image gets a floor under its height, because the band is
 * as tall as whatever copy the page passes and `cover` crops the statue to
 * fit: About, with a title and no lead, was short enough to cut the statue
 * off at the head. 22rem is Contact's natural height — the fullest of these
 * four headers, and the framing the firm signed off — so the others now
 * match it and a longer page (Insights) is still free to grow past it.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  trail,
  image = true,
  photo,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  trail?: { label: string; href?: string }[];
  /** The pale Lady Justice ground (`hero-bg-other`); on unless set false. */
  image?: boolean;
  /**
   * A photograph URL for a dark band instead: the frame on the right, a
   * navy wash across the left where the copy sits, white type. Used by the
   * practice pages with that practice's photograph. Wins over `image`.
   */
  photo?: string | null;
  /** Shown to the right of the title on wide screens (below it on phones), e.g. an article's cover. */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const heroBg = !photo && image ? publicImage("hero-bg-other") : null;
  const heroSize = heroBg ? publicImageSize(heroBg) : null;
  const dark = Boolean(photo);

  return (
    <section
      className={`relative overflow-hidden border-b ${
        dark
          ? "border-ink-deep bg-ink-deep text-white"
          : heroBg
            ? "border-line-strong bg-hero-cream text-ink"
            : "border-line-strong bg-paper-tint text-ink"
      } ${dark ? "flex min-h-[22rem] items-center" : ""} ${
        heroBg ? "flex min-h-[21rem] items-center sm:min-h-[24rem]" : ""
      }`}
    >
      {/* Drawn at exactly the band's height and pinned right, so the statue
          is never cropped top or bottom; any width the frame doesn't cover
          on the left is the frame's own cream (`hero-cream`). Every page's
          header copy fits in 24rem, so every band is the same height and
          the statue sits in the same place — article pages, with a cover
          beside the title, are the one exception and grow to fit. */}
      {heroBg && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 h-full"
          style={{ aspectRatio: heroSize ? `${heroSize.width} / ${heroSize.height}` : "8 / 3" }}
        >
          <Image src={heroBg} alt="" fill priority quality={90} sizes="1100px" className="object-cover object-right" />
          {/* Fades the frame's left edge into the band's cream, so no seam
              shows where the photograph ends on a wide screen. */}
          <div className="absolute inset-y-0 left-0 w-1/5 bg-[linear-gradient(to_right,var(--color-hero-cream),transparent)]" />
        </div>
      )}
      {photo && (
        <>
          <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
            <Image
              src={photo}
              alt=""
              fill
              priority
              quality={90}
              sizes="(min-width: 1024px) 64vw, 100vw"
              className="object-cover brightness-125 saturate-110"
            />
          </div>
          {/* Solid navy under the copy on the left, easing out over the
              photograph; on phones, where the copy runs across the whole
              frame, an even wash instead. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-ink-deep)_70%,transparent)] lg:bg-[linear-gradient(90deg,var(--color-ink-deep)_0%,var(--color-ink-deep)_32%,color-mix(in_oklab,var(--color-ink-deep)_45%,transparent)_48%,transparent_72%)]"
          />
        </>
      )}
      <div className={`container-page relative py-12 sm:py-14 ${aside ? "grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]" : ""}`}>
        <div className="min-w-0">
        {trail && <Breadcrumbs trail={trail} tone={dark ? "dark" : "light"} />}
        {eyebrow && (
          <p className={`eyebrow mt-6 inline-flex items-center gap-2.5 ${dark ? "text-gold-bright" : "text-gold-deep"}`}>
            <span aria-hidden="true" className={`w-8 border-t ${dark ? "border-gold-bright/70" : "border-gold/70"}`} />
            {eyebrow}
          </p>
        )}
        <h1 className={`mt-3 max-w-4xl font-serif text-[1.7rem] font-semibold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl ${dark ? "text-white" : ""}`}>
          {titleCase(title)}
        </h1>
        {lead && (
          <p className={`mt-4 text-base leading-relaxed sm:mt-5 sm:text-lg ${dark ? "max-w-2xl text-white/85" : "max-w-3xl text-ink-soft"}`}>
            {lead}
          </p>
        )}
        {children}
        </div>
        {aside}
      </div>
    </section>
  );
}

/**
 * An article's picture, exactly as its Insights card shows it: the uploaded
 * cover, else the bundled photograph, else the drawn artwork for its subject.
 */
export function InsightCover({ insight, sizes, className = "" }: { insight: Insight; sizes: string; className?: string }) {
  const image = insight.coverUrl ?? (insight.imageBase ? publicImage(insight.imageBase) : null);
  return (
    <div className={`relative aspect-[16/9] overflow-hidden bg-ink ${className}`}>
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          unoptimized={Boolean(insight.coverUrl)}
          style={insight.imageFocus ? { objectPosition: insight.imageFocus } : undefined}
          className="object-cover"
        />
      ) : (
        <InsightArtwork artwork={insight.artwork} className="h-full w-full" />
      )}
    </div>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
