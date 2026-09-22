export type Role = {
  slug: string;
  title: string;
  detail: string;
};

/**
 * Open roles. Replace with the firm's actual vacancies — these describe the
 * shape of the practice rather than confirmed openings, and the firm should
 * confirm each before publication.
 *
 * Shared between the roles list on `/careers` and the per-role application
 * page at `/careers/apply/[role]`, so the two cannot drift apart.
 */
export const roles: Role[] = [
  {
    slug: "corporate-advisory",
    title: "Associate — Corporate Advisory",
    detail:
      "Transaction work across acquisitions, private equity investments and joint ventures. You will run legal due diligence workstreams, draft transaction documents under supervision, and manage regulatory filings.",
  },
  {
    slug: "dispute-resolution",
    title: "Associate — Dispute Resolution",
    detail:
      "Commercial litigation and arbitration. Drafting pleadings and interim applications, briefing and appearing in the district judiciary and tribunals, and assisting on High Court matters.",
  },
];

/** For a candidate who doesn't fit a listed role but wants to apply anyway. */
export const speculativeRole: Role = {
  slug: "speculative-application",
  title: "Speculative Application",
  detail:
    "Tell us about the work you want to do and the experience you would bring to it, even though none of the roles above are an exact fit.",
};

export const roleBySlug = new Map(
  [...roles, speculativeRole].map((role) => [role.slug, role]),
);
