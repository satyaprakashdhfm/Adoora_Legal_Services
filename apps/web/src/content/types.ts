/** Shared shapes for the practice-area and industry page templates. */

export type OverviewBlock = {
  heading: string;
  /** One paragraph per entry. */
  body: string[];
};

export type ServiceItem = {
  title: string;
  body: string;
};

export type ProcessStage = {
  stage: string;
  detail: string;
};

export type Faq = {
  q: string;
  a: string;
};

export type PracticeArea = {
  slug: string;
  name: string;
  /** Used in dense nav lists where the full name is too long. */
  shortName: string;
  /** Grouping for the four-column practice list on the home page. */
  group: "Corporate" | "Finance" | "Disputes" | "Regulatory";
  tagline: string;
  overview: OverviewBlock[];
  services: ServiceItem[];
  /** Factual, non-promissory descriptions of the kind of work handled. */
  matters: string[];
  /** Courts, tribunals and regulators appeared before or dealt with. */
  forums: string[];
  process: ProcessStage[];
  /** Slugs from `people.ts`. */
  team: string[];
  /** Slugs from `industries.ts`. */
  relatedIndustries: string[];
  faqs: Faq[];
};

export type Industry = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  overview: OverviewBlock[];
  /** Matter types tailored to this industry. */
  commonMatters: ServiceItem[];
  representativeWork: string[];
  regulators: string[];
  team: string[];
  /** Slugs from `practice-areas.ts`. */
  relatedPractices: string[];
  faqs: Faq[];
};
