/**
 * Insights, news and explainers.
 *
 * These are written as practitioner explainers — a question a client actually
 * asks, answered with the statutory position and the practical consequence.
 * They are informational and expressly not legal advice; every article page
 * carries that notice.
 *
 * When the CMS in `apps/api` goes live these move into the database and this
 * file becomes the seed data. Keep the shape stable.
 */

import type { ArtworkKey } from "@/components/insight-artwork";

export type InsightCategory =
  | "Regulatory Update"
  | "Explainer"
  | "Deal Announcement"
  | "Event Recap"
  | "Judgment";

/**
 * Body blocks, kept deliberately small so the renderer stays simple. The
 * console's article editor writes the same shapes (plus `h3` and `image`).
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string };

export type Insight = {
  slug: string;
  title: string;
  category: InsightCategory;
  /** ISO date — used for sorting and for the Article schema. */
  date: string;
  /** Person slug from `people.ts`. */
  author: string;
  readingTime: string;
  summary: string;
  /**
   * Which generated composition heads the card — see `insight-artwork.tsx`.
   * Drawn rather than photographed because the firm has no photography for
   * these and stock legal imagery is uniformly bad.
   */
  artwork: ArtworkKey;
  /**
   * Base name in `public/` of this article's photograph, without an extension.
   * The card uses the photograph when the file is there and the artwork when
   * it is not — so a name can be set ahead of the file arriving.
   */
  imageBase?: string;
  /**
   * CSS `object-position` for the photograph. Cards are 16:9 and most frames
   * are taller, so `cover` keeps only the middle band; set this when the
   * subject sits above or below it.
   */
  imageFocus?: string;
  keyTakeaways: string[];
  /** Practice-area slugs. */
  practices: string[];
  /** Industry slugs. */
  industries: string[];
  body: Block[];
  /** Articles written in the console: an uploaded cover image. */
  coverUrl?: string | null;
  /** Articles written in the console: the SEO title, when it differs from the headline. */
  metaTitle?: string | null;
  keywords?: string[];
  /** ISO date of the last edit, for the Article schema. */
  updated?: string;
};

export const insights: Insight[] = [
  {
    slug: "digital-lending-directions-what-your-lsp-agreement-must-say",
    title:
      "The RBI's digital lending framework: what your loan service provider agreement must actually say",
    category: "Regulatory Update",
    date: "2026-08-18",
    author: "r-adoora",
    readingTime: "7 min read",
    artwork: "network",
    imageBase: "insight-digital-lending",
    summary:
      "Most digital lending arrangements we review were drafted as ordinary service contracts and then patched for the RBI's directions. That order is the problem — the framework changes who may hold the customer, who may collect money, and what must be disclosed before the borrower commits.",
    keyTakeaways: [
      "The regulated entity remains accountable for the borrower relationship — outsourcing the technology does not outsource the obligation.",
      "The Key Fact Statement must disclose the all-in annual percentage rate, and any fee not in it cannot later be charged.",
      "Money must flow between the borrower and the regulated entity directly; the loan service provider's account should not sit in the middle.",
      "Data collected must be need-based and consented, and the LSP cannot retain borrower data on its own account.",
      "A cooling-off period must be genuinely available, not disclosed and then made impractical.",
    ],
    practices: ["banking-finance"],
    industries: ["financial-services", "technology-media-telecom"],
    body: [
      {
        type: "p",
        text: "A pattern shows up repeatedly when we are asked to review a digital lending stack. The commercial arrangement between the lender and its technology partner was negotiated first, as a services contract with a revenue share. The Reserve Bank of India's digital lending directions were then addressed by adding a compliance schedule at the back. The schedule says the right things. The operative clauses in the body of the agreement contradict it.",
      },
      {
        type: "p",
        text: "That is not a drafting nicety. The framework allocates responsibility in a way that a services contract, left to its own logic, will tend to reverse.",
      },
      { type: "h2", text: "The borrower belongs to the regulated entity" },
      {
        type: "p",
        text: "The starting principle is that the regulated entity — the bank or NBFC whose balance sheet carries the loan — remains answerable for the lending relationship regardless of how much of the journey a partner operates. A loan service provider may source the customer, run the interface, score the application and service the account. None of that transfers the regulatory obligation.",
      },
      {
        type: "p",
        text: "Where agreements go wrong is in the provisions that assume otherwise: exclusive control of the customer relationship granted to the platform, restrictions on the lender contacting its own borrowers, or data and marketing rights that treat the borrower base as the platform's asset. Those clauses are commercially understandable and regulatorily untenable.",
      },
      { type: "h2", text: "Disclosure: the Key Fact Statement is the document that matters" },
      {
        type: "p",
        text: "Before the borrower commits, they must receive a Key Fact Statement setting out the all-in cost of the loan expressed as an annual percentage rate, together with the recovery mechanism, the grievance officer's details and the cooling-off period. The rule that gives this teeth is the corollary: a charge not disclosed in the KFS cannot be recovered from the borrower later.",
      },
      {
        type: "p",
        text: "In practice this requires the product and legal teams to agree on something they often have not — a single number. Processing fees, insurance premiums bundled into the disbursement, platform convenience charges and penal amounts all have to be accounted for. We have seen arrangements where the platform's fee was structured as a separate charge to the borrower precisely so that it sat outside the lender's rate card. Under the current framework that is a disclosure failure with a direct revenue consequence.",
      },
      { type: "h2", text: "Money should not pass through the partner" },
      {
        type: "p",
        text: "Disbursement must go from the lender's account to the borrower's account, and repayment from the borrower's account to the lender's, without the loan service provider's pool account in between. The exception is narrow and specific. This single requirement invalidates a good number of older escrow-and-sweep designs, and it is worth checking against the actual payment flow rather than the flow diagram in the agreement, because the two are not always the same.",
      },
      { type: "h2", text: "Data: need-based, consented, and not the platform's to keep" },
      {
        type: "p",
        text: "Data collection must be limited to what the product needs, with the borrower's explicit consent and an option to withdraw it. Access to the borrower's contact list, media files and location — historically the source of the sector's worst conduct — is outside what is permissible for a lending app. The loan service provider must not store borrower data other than basic minimum data required for its function.",
      },
      {
        type: "p",
        text: "The Digital Personal Data Protection Act, 2023 now runs alongside this. The two regimes have different architectures and are best handled together at the design stage: the RBI's rules restrict what may be collected in this specific context, while the DPDP Act governs notice, purpose limitation, retention and the borrower's rights over the data once collected. Building consent flows for one and retrofitting the other is how organisations end up with a notice that does not describe what the product does.",
      },
      { type: "h2", text: "Recovery and grievance" },
      {
        type: "p",
        text: "Recovery agents must be identified to the borrower and their conduct is the regulated entity's responsibility. A nodal grievance redressal officer must be named and reachable, and unresolved complaints escalate to the RBI's ombudsman scheme. Agreements should therefore specify not merely that the partner will comply with recovery norms, but the audit rights, conduct standards, escalation timelines and termination consequences that make compliance verifiable.",
      },
      { type: "h2", text: "What to do with an existing arrangement" },
      {
        type: "ol",
        items: [
          "Map the actual payment flow, end to end, and compare it with the agreement. Discrepancies here are the most common and the most serious.",
          "Reconcile the KFS against every charge the borrower actually pays, including anything invoiced by the platform.",
          "Review the app's permissions and the data the partner stores, then align the notice, the consent flow and the contract with what the product genuinely requires.",
          "Check the operative clauses — customer relationship, data rights, exclusivity — for anything that contradicts the compliance schedule, and fix the body of the agreement rather than the schedule.",
          "Confirm the cooling-off mechanism works in the product, not just on paper.",
        ],
      },
      {
        type: "p",
        text: "None of this is difficult once the arrangement is looked at as a regulated lending relationship that happens to be delivered digitally, rather than as a technology partnership that happens to involve credit. The sequence of drafting is what usually needs to change.",
      },
    ],
  },
];

/** Newest first — used by the home page and the insights index. */
export const insightsByDate = [...insights].sort((a, b) =>
  b.date.localeCompare(a.date),
);

export const insightBySlug = new Map(
  insights.map((insight) => [insight.slug, insight]),
);

export function insightsForPractice(slug: string, limit = 3): Insight[] {
  return insightsByDate
    .filter((insight) => insight.practices.includes(slug))
    .slice(0, limit);
}

export function insightsForIndustry(slug: string, limit = 3): Insight[] {
  return insightsByDate
    .filter((insight) => insight.industries.includes(slug))
    .slice(0, limit);
}

export const insightCategories: InsightCategory[] = [
  "Regulatory Update",
  "Explainer",
  "Deal Announcement",
  "Event Recap",
  "Judgment",
];
