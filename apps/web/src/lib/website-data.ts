import { people as staticPeople, type Person, type Spotlight } from "@/content/people";
import { insights as bundledInsights, type Block, type Insight, type InsightCategory } from "@/content/insights";
import type { ArtworkKey } from "@/components/insight-artwork";

/**
 * Content the firm maintains from the admin console — lawyer profiles and
 * job openings — read on the server for the public pages.
 *
 * Fetched from the API with a five-minute revalidation, tagged so a save in
 * the console refreshes the pages straight away (see `app/revalidate`).
 *
 * When the API cannot be reached — notably during `next build` on Railway,
 * where the private network does not exist yet — profiles fall back to the
 * roster bundled in `people.ts`, so a page is never built empty; the next
 * revalidation replaces it with the live list. The same fallback covers the
 * interval before anyone has imported that roster into the console.
 */

const apiOrigin = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export const PEOPLE_TAG = "website-people";
export const JOBS_TAG = "website-jobs";
export const ARTICLES_TAG = "website-articles";

/** The parsed body, or null when it is missing (404) or the API is unreachable. */
async function fromApi<T>(path: string, tag: string): Promise<T | null> {
  try {
    const response = await fetch(`${apiOrigin}/api${path}`, {
      next: { revalidate: 300, tags: [tag] },
      signal: AbortSignal.timeout(4000),
    });
    return response.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
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

/** The home page trio the static roster featured, for the fallback. */
const STATIC_FEATURED = ["ganesh-raghavendra", "vidya-sagar", "kondal-rao"];

function initials(name: string): string {
  return name
    .replace(/^adv\.?\s+/i, "")
    .split(/[\s.]+/)
    .filter((part) => part.length > 1)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("");
}

function spotlight(profile: ApiProfile): Spotlight | undefined {
  if (!profile.summary) return undefined;
  const credentials: Spotlight["credentials"] = [];
  if (profile.qualification) credentials.push({ icon: "degree", title: profile.qualification, detail: "Qualification" });
  if (profile.enrolment || profile.stateBar) {
    credentials.push({ icon: "bar", title: "Admitted to the Bar", detail: profile.stateBar ?? profile.enrolment ?? "" });
  }
  if (profile.experience) credentials.push({ icon: "experience", title: profile.experience, detail: "Experience" });
  return { summary: profile.summary, credentials };
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
  return staticPeople.map((person) => ({ ...person, featured: STATIC_FEATURED.includes(person.slug) }));
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
  const fromConsole = (result?.data ?? []).map(toInsight);
  const taken = new Set(fromConsole.map((insight) => insight.slug));
  return [...fromConsole, ...bundledInsights.filter((insight) => !taken.has(insight.slug))].sort((a, b) =>
    b.date.localeCompare(a.date),
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
