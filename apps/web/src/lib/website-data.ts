import { people as staticPeople, type Person, type Spotlight } from "@/content/people";
import { insights as bundledInsights, type Block, type Insight, type InsightCategory } from "@/content/insights";
import type { ArtworkKey } from "@/components/insight-artwork";
import type { PartnerItem } from "@/content/partners";
import { DEFAULT_CONTACT, toPublicContact, type ContactSettings, type PublicContact } from "@/lib/contact";

/**
 * Content the firm maintains from the admin console — lawyer profiles, job
 * openings and partner logos — read on the server for the public pages.
 *
 * Fetched from the API with a five-minute revalidation, tagged so a save in
 * the console refreshes the pages straight away (see `app/revalidate`).
 *
 * The private network does not exist during `next build` on Railway, so the
 * API's public address is tried when the private one cannot be reached;
 * without it the pages were built with no partners or articles and showed
 * that to the first visitors after every deploy. If neither answers,
 * profiles fall back to the roster bundled in `people.ts` (also used before
 * anyone has imported that roster into the console), and the next
 * revalidation replaces whatever was built with the live data.
 */

const trimmed = (value: string | undefined) => value?.trim().replace(/\/$/, "") || null;
/** Railway gives every service the API's public domain, without a scheme. */
const publicApi = trimmed(process.env.RAILWAY_SERVICE_ADOORA_API_URL);
const apiOrigins = [
  ...new Set(
    [
      trimmed(process.env.API_INTERNAL_URL),
      trimmed(process.env.NEXT_PUBLIC_API_URL),
      publicApi ? (publicApi.startsWith("http") ? publicApi : `https://${publicApi}`) : null,
    ].filter((origin): origin is string => Boolean(origin)),
  ),
];
if (apiOrigins.length === 0) apiOrigins.push("http://localhost:4000");

export const PEOPLE_TAG = "website-people";
export const JOBS_TAG = "website-jobs";
export const ARTICLES_TAG = "website-articles";
export const PARTNERS_TAG = "website-partners";
export const SETTINGS_TAG = "website-settings";

/**
 * The parsed body, or null when it is missing (404) or no address for the
 * API answers. The next address is tried only when one cannot be reached at
 * all; an answer, even an error, is final.
 */
async function fromApi<T>(path: string, tag: string): Promise<T | null> {
  // A page built without the API's answer keeps only the bundled content
  // until it is next revalidated (Insights once showed one article of three
  // that way), so the build waits longer and tries every address twice.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const rounds = building ? 2 : 1;
  for (let round = 0; round < rounds; round++) {
    for (const origin of apiOrigins) {
      try {
        const response = await fetch(`${origin}/api${path}`, {
          next: { revalidate: 300, tags: [tag] },
          signal: AbortSignal.timeout(building ? 15_000 : 4000),
        });
        return response.ok ? ((await response.json()) as T) : null;
      } catch {
        // Unreachable from here (e.g. the private network during a build): try the next address.
      }
    }
  }
  if (building) console.warn(`[website-data] API unreachable during build for ${path}; the page falls back to bundled content`);
  return null;
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

type ApiProfile = {
  slug: string;
  name: string;
  designation: string;
  group: "LEGAL" | "BUSINESS";
  qualification: string | null;
  office: string | null;
  enrolment: string | null;
  stateBar: string | null;
  enrolledSince: number | null;
  experience: string | null;
  practices: string[];
  education: string[];
  bio: string[];
  memberships: string[];
  email: string | null;
  summary: string | null;
  photo: string | null;
  photoUrl: string | null;
  featured: boolean;
};

/**
 * Who the fallback shows when the API cannot be reached: the founder only.
 * Everyone else is on the website through the console, not the bundled roster.
 */
const STATIC_FALLBACK = ["ganesh-raghavendra"];

/**
 * The home page's portrait for each person: a studio portrait in public/
 * (people1-3 and the founder's), or null for the silhouette placeholder until
 * a better photo is supplied.
 */
export const STUDIO_PORTRAITS: Record<string, string | null> = {
  "ganesh-raghavendra": "person-ganesh-raghavendra",
  "vidya-sagar": "people2",
  "kondal-rao": "people3",
};

function initials(name: string): string {
  return name
    .replace(/^adv\.?\s+/i, "")
    .split(/[\s.]+/)
    .filter((part) => part.length > 1)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

/*
 * The card's introduction: the console profile's, else the bundled roster's
 * (`content/people.ts`) for that slug.
 */
function spotlight(profile: ApiProfile): Spotlight | undefined {
  const bundled = staticPeople.find((person) => person.slug === profile.slug)?.spotlight;
  const summary = profile.summary ?? bundled?.summary;
  return summary ? { summary } : undefined;
}

const undef = <T,>(value: T | null): T | undefined => value ?? undefined;
const list = (value: string[]) => (value.length ? value : undefined);

function toPerson(profile: ApiProfile): Person & { featured: boolean } {
  return {
    slug: profile.slug,
    name: profile.name,
    designation: profile.designation,
    group: profile.group === "BUSINESS" ? "business" : "legal",
    qualification: undef(profile.qualification),
    office: undef(profile.office),
    enrolment: undef(profile.enrolment),
    stateBar: undef(profile.stateBar),
    enrolledSince: undef(profile.enrolledSince),
    experience: undef(profile.experience),
    practices: list(profile.practices),
    education: list(profile.education),
    bio: list(profile.bio),
    memberships: list(profile.memberships),
    email: undef(profile.email),
    photo: undef(profile.photo),
    photoUrl: undef(profile.photoUrl),
    initials: initials(profile.name) || "—",
    spotlight: spotlight(profile),
    featured: profile.featured,
  };
}

/** Every published profile, in the console's order. */
export async function getPeople(): Promise<(Person & { featured: boolean })[]> {
  const result = await fromApi<{ data: ApiProfile[] }>("/public/people", PEOPLE_TAG);
  if (result?.data?.length) return result.data.map(toPerson);
  return staticPeople
    .filter((person) => STATIC_FALLBACK.includes(person.slug))
    .map((person) => ({ ...person, featured: true }));
}

/** Who an article published without a writer's name is credited to: the founder. */
export const DEFAULT_AUTHOR = "ganesh-raghavendra";
/** The founder's full name, always used for him on articles, whatever his profile is called. */
export const FOUNDER_NAME = "Adv. K. L. Ganesh Raghavendra";

const bareName = (name: string) => name.replace(/^adv\.?\s+/i, "").replace(/\s+/g, " ").trim().toLowerCase();

export type ArticleAuthor = { name: string; initials: string; person: Person | null };

/**
 * An article's writer. `author` is the full name typed under "Written by",
 * or a profile slug (articles from before that field); empty means the
 * founder, who is always shown by his full name (FOUNDER_NAME). A name or slug that matches a profile brings the profile (link,
 * designation); any other name is shown as typed.
 */
export function articleAuthor(people: Person[], author: string): ArticleAuthor {
  const value = author.trim() || DEFAULT_AUTHOR;
  const person = people.find((p) => p.slug === value || bareName(p.name) === bareName(value)) ?? null;
  if (person?.slug === DEFAULT_AUTHOR || value === DEFAULT_AUTHOR || bareName(value) === bareName(FOUNDER_NAME)) {
    const founder = person ?? people.find((p) => p.slug === DEFAULT_AUTHOR) ?? null;
    return { name: FOUNDER_NAME, initials: initials(FOUNDER_NAME), person: founder ? { ...founder, name: FOUNDER_NAME } : null };
  }
  if (person) return { name: person.name, initials: person.initials, person };
  return { name: value, initials: initials(value) || "—", person: null };
}

export async function getFeaturedPeople(): Promise<Person[]> {
  const all = await getPeople();
  const featured = all.filter((person) => person.featured);
  return featured.length ? featured : all.filter((p) => p.group === "legal").slice(0, 3);
}

/**
 * The lawyers to show on a practice or sector page: whoever lists that
 * practice on their profile, or else the slugs the page's content names.
 */
export function teamFor(people: Person[], options: { practice?: string; slugs?: string[] }): Person[] {
  if (options.practice) {
    const byPractice = people.filter((person) => person.practices?.includes(options.practice!));
    if (byPractice.length) return byPractice;
  }
  const bySlug = new Map(people.map((person) => [person.slug, person]));
  return (options.slugs ?? []).map((slug) => bySlug.get(slug)).filter((p): p is Person => Boolean(p));
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

/**
 * The home page's partner logos, exactly as listed under Website → Our
 * Partners. No bundled stand-in: when the API cannot be reached (as during a
 * build on Railway) the section is left out until the next revalidation,
 * rather than showing partners the console does not have.
 */
export async function getPartners(): Promise<PartnerItem[]> {
  const result = await fromApi<{ data: PartnerItem[] }>("/public/partners", PARTNERS_TAG);
  return result?.data ?? [];
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type Job = {
  slug: string;
  title: string;
  practiceArea: string | null;
  location: string | null;
  employmentType: string;
  experience: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  closesOn: string | null;
  publishedAt: string | null;
};

/** Open roles, or null when the API could not be reached. */
export async function getJobs(): Promise<Job[] | null> {
  const result = await fromApi<{ data: Job[] }>("/public/jobs", JOBS_TAG);
  return result?.data ?? null;
}

export async function getJob(slug: string): Promise<Job | null> {
  const result = await fromApi<Job>(`/public/jobs/${encodeURIComponent(slug)}`, JOBS_TAG);
  return result ?? null;
}

// ---------------------------------------------------------------------------
// Articles (Insights)
// ---------------------------------------------------------------------------

/** What the API stores in an article body: images by id, not by URL. */
type ApiBlock = Exclude<Block, { type: "image" }> | { type: "image"; imageId: string; alt: string; caption?: string };

type ApiArticle = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  keywords: string[];
  authorSlug: string | null;
  coverUrl: string | null;
  readingTime: string | null;
  publishedAt: string | null;
  updatedAt: string;
  practices: string[];
  industries: string[];
  keyTakeaways: string[];
  metaTitle?: string | null;
  body?: ApiBlock[];
};

/** Console articles have no drawn artwork chosen; one is picked from the category. */
const ARTWORK_FOR: Record<string, ArtworkKey> = {
  "Regulatory Update": "threshold",
  Explainer: "network",
  "Deal Announcement": "parcels",
  "Event Recap": "datamap",
  Judgment: "interim",
};

function toInsight(article: ApiArticle): Insight {
  return {
    slug: article.slug,
    title: article.title,
    category: article.category as InsightCategory,
    date: (article.publishedAt ?? article.updatedAt).slice(0, 10),
    updated: article.updatedAt.slice(0, 10),
    author: article.authorSlug ?? "",
    readingTime: article.readingTime ?? "",
    summary: article.summary,
    artwork: ARTWORK_FOR[article.category] ?? "boundary",
    coverUrl: article.coverUrl,
    metaTitle: article.metaTitle ?? null,
    keywords: article.keywords,
    keyTakeaways: article.keyTakeaways,
    practices: article.practices,
    industries: article.industries,
    body: (article.body ?? []).map((block) =>
      block.type === "image"
        ? { type: "image", src: `/api/public/article-images/${block.imageId}`, alt: block.alt, caption: block.caption }
        : block,
    ),
  };
}

/**
 * Every published article, newest first: those written in the console and
 * the ones bundled in `insights.ts`. A console article with the same slug as
 * a bundled one replaces it.
 */
export async function getInsights(): Promise<Insight[]> {
  const result = await fromApi<{ data: ApiArticle[] }>("/public/articles", ARTICLES_TAG);
  const articles = result?.data ?? [];
  const fromConsole = articles.map(toInsight);
  const taken = new Set(fromConsole.map((insight) => insight.slug));
  // Newest first. Console articles carry the exact publishing time, so two
  // published the same day still come out latest first.
  const publishedAt = new Map(articles.map((article) => [article.slug, article.publishedAt ?? article.updatedAt]));
  const when = (insight: Insight) => publishedAt.get(insight.slug) ?? `${insight.date}T00:00:00.000Z`;
  return [...fromConsole, ...bundledInsights.filter((insight) => !taken.has(insight.slug))].sort((a, b) =>
    when(b).localeCompare(when(a)),
  );
}

export async function getInsight(slug: string): Promise<Insight | null> {
  const fromConsole = await fromApi<ApiArticle>(`/public/articles/${encodeURIComponent(slug)}`, ARTICLES_TAG);
  if (fromConsole) return toInsight(fromConsole);
  return bundledInsights.find((insight) => insight.slug === slug) ?? null;
}

export async function insightsFor(kind: "practice" | "industry", slug: string, limit = 3): Promise<Insight[]> {
  return (await getInsights())
    .filter((insight) => (kind === "practice" ? insight.practices : insight.industries).includes(slug))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

/** The contact details and social profiles from Site settings; the firm's defaults if the API cannot be reached. */
export async function getContact(): Promise<PublicContact> {
  const settings = await fromApi<Partial<ContactSettings>>("/public/settings", SETTINGS_TAG);
  return settings ? toPublicContact(settings) : DEFAULT_CONTACT;
}
