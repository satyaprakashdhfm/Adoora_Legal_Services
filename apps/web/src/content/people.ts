/**
 * ============================================================================
 * PLACEHOLDER DATA — MUST BE REPLACED BEFORE THE SITE GOES LIVE
 * ============================================================================
 *
 * These profiles exist so the practice-area, domain and About pages render with
 * realistic content while the firm supplies the real ones. Every field below is
 * illustrative.
 *
 * Bar Council enrolment numbers are deliberately left as `null` rather than
 * invented: publishing a fabricated enrolment number against a named advocate
 * would misrepresent a verifiable professional credential. The UI omits the
 * enrolment line entirely when the value is null, so nothing looks broken —
 * but the profiles are not publishable as they stand.
 *
 * To replace: supply for each lawyer their name, designation, office,
 * enrolment number and state bar, year of enrolment, education, practice
 * areas, and any publications or speaking engagements.
 */

export type Person = {
  slug: string;
  name: string;
  designation: string;
  office: string;
  /** Bar Council enrolment number. `null` until the firm confirms it. */
  enrolment: string | null;
  /** State Bar Council of enrolment. `null` until confirmed. */
  stateBar: string | null;
  /** Year first enrolled as an advocate. `null` until confirmed. */
  enrolledSince: number | null;
  experience: string;
  /** Slugs from `practice-areas.ts`. */
  practices: string[];
  education: string[];
  bio: string[];
  publications: string[];
  memberships: string[];
  email: string;
  /** Initials used by the avatar placeholder until photography is supplied. */
  initials: string;
};

export const people: Person[] = [
  {
    slug: "r-adoora",
    name: "Ravi Adoora",
    designation: "Founder & Managing Partner",
    office: "Hyderabad",
    enrolment: null,
    stateBar: null,
    enrolledSince: null,
    experience: "25+ years",
    practices: ["corporate-ma", "banking-finance", "taxation"],
    education: [
      "LL.M., Corporate and Commercial Law",
      "LL.B., Osmania University",
      "B.Com., Osmania University",
    ],
    bio: [
      "Ravi leads the firm's corporate and finance practice, advising Indian and international clients on acquisitions, joint ventures, financings and group reorganisations. He works most often on transactions where the structuring question and the regulatory question cannot be separated — foreign investment into regulated sectors, staged acquisitions, and financings with a cross-border element.",
      "He also advises boards on governance, related party approvals and directors' duties, and is regularly involved at the point where a transaction becomes contentious.",
    ],
    publications: [
      "Contributor, commentary on foreign investment routes and pricing guidelines under FEMA",
      "Speaker, regional industry forums on transaction structuring and regulatory approvals",
    ],
    memberships: ["Bar Council of India", "Hyderabad Bar Association"],
    email: "info@adooralegalservices.com",
    initials: "RA",
  },
  {
    slug: "s-venkatesh",
    name: "S. Venkatesh",
    designation: "Partner — Dispute Resolution",
    office: "Hyderabad",
    enrolment: null,
    stateBar: null,
    enrolledSince: null,
    experience: "18+ years",
    practices: ["dispute-resolution", "banking-finance", "taxation"],
    education: [
      "LL.B., Andhra University",
      "B.A. (Economics), Andhra University",
    ],
    bio: [
      "Venkatesh handles the firm's contentious work — commercial litigation, domestic and institutional arbitration, and the interim applications that frequently determine how a dispute settles. He appears before the High Courts of Telangana, Andhra Pradesh and Karnataka, the NCLT and NCLAT, and the Debts Recovery Tribunals.",
      "A substantial part of his practice concerns construction and infrastructure claims and recovery and insolvency matters for financial institutions, including enforcement of facilities documented elsewhere.",
    ],
    publications: [
      "Contributor, notes on interim relief under Section 9 of the Arbitration and Conciliation Act, 1996",
    ],
    memberships: ["Bar Council of India", "Telangana High Court Advocates' Association"],
    email: "info@adooralegalservices.com",
    initials: "SV",
  },
  {
    slug: "p-lakshmi",
    name: "P. Lakshmi Prasanna",
    designation: "Partner — Employment & Regulatory",
    office: "Bengaluru",
    enrolment: null,
    stateBar: null,
    enrolledSince: null,
    experience: "14+ years",
    practices: ["labour-employment", "technology-media-telecom", "corporate-ma"],
    education: [
      "LL.M., Labour and Administrative Law",
      "B.A., LL.B. (Hons.), National Law University",
    ],
    bio: [
      "Lakshmi advises employers on workforce structuring, the transition to the labour codes, contract labour exposure and industrial relations, and manages the sensitive matters — investigations, disciplinary process, exits and retrenchment — through to tribunal proceedings where they get there.",
      "She also leads the firm's data protection work, advising technology and services businesses on DPDP readiness, consent architecture and breach response, and constitutes and trains Internal Committees under the POSH Act.",
    ],
    publications: [
      "Contributor, employer guidance on the wage definition under the Code on Wages, 2019",
      "Speaker, workshops on POSH compliance and workplace investigations",
    ],
    memberships: ["Bar Council of India", "Bangalore Advocates' Association"],
    email: "info@adooralegalservices.com",
    initials: "LP",
  },
  {
    slug: "m-rao",
    name: "M. Srinivasa Rao",
    designation: "Partner — Real Estate & Infrastructure",
    office: "Amaravati",
    enrolment: null,
    stateBar: null,
    enrolledSince: null,
    experience: "20+ years",
    practices: ["real-estate-infrastructure", "dispute-resolution", "intellectual-property"],
    education: ["LL.B., Nagarjuna University", "B.Sc., Nagarjuna University"],
    bio: [
      "Srinivasa Rao leads the firm's land and development practice. He conducts title investigation and prepares title reports for acquisitions and aggregations across Andhra Pradesh and Telangana, and advises developers and landowners on joint development structures, RERA registration and project compliance.",
      "He also acts in the disputes this work generates — specific performance and injunction suits, partition claims affecting project land, RERA and consumer proceedings, and construction arbitrations.",
    ],
    publications: [
      "Contributor, practitioner notes on land records reform and title verification practice in the Telugu states",
    ],
    memberships: ["Bar Council of India", "Andhra Pradesh High Court Advocates' Association"],
    email: "info@adooralegalservices.com",
    initials: "SR",
  },
  {
    slug: "a-krishnan",
    name: "Aditya Krishnan",
    designation: "Partner — Technology & Intellectual Property",
    office: "Bengaluru",
    enrolment: null,
    stateBar: null,
    enrolledSince: null,
    experience: "12+ years",
    practices: [
      "technology-media-telecom",
      "intellectual-property",
      "corporate-ma",
    ],
    education: [
      "B.A., LL.B. (Hons.), National Academy of Legal Studies and Research",
    ],
    bio: [
      "Aditya advises technology companies and enterprise customers on the contracting layer under digital products — SaaS and licensing terms, cloud and outsourcing arrangements, and the data, IP, service level and liability provisions where these negotiations actually concentrate.",
      "He handles trade mark portfolios and enforcement, advises on code and content ownership, and works with founders through funding rounds, ESOP design and the corporate cleanup that precedes serious diligence.",
    ],
    publications: [
      "Contributor, commentary on intermediary due diligence and safe harbour under the IT Rules",
      "Speaker, sessions on DPDP readiness for product and engineering teams",
    ],
    memberships: ["Bar Council of India"],
    email: "info@adooralegalservices.com",
    initials: "AK",
  },
];

export const personBySlug = new Map(people.map((person) => [person.slug, person]));

export function peopleBySlugs(slugs: string[]): Person[] {
  return slugs
    .map((slug) => personBySlug.get(slug))
    .filter((person): person is Person => Boolean(person));
}
