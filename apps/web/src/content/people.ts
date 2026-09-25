/**
 * The firm's people, as listed in the ADOORA Legal Services brochure.
 *
 * The brochure gives names and designations, and nothing else. Everything
 * beyond that — office, years of experience, education, practice areas,
 * publications, Bar Council enrolment — is left undefined rather than invented,
 * because publishing a fabricated credential against a named advocate
 * misrepresents something a reader can verify. The UI omits any field that is
 * absent, so the roster renders cleanly as it stands and fills out on its own
 * as the firm supplies more.
 *
 * To extend a profile, add the fields to that person's entry: `bio` is what
 * promotes them from a roster card to a full profile on the About page.
 */

export type Person = {
  slug: string;
  name: string;
  designation: string;
  /** Which roster the person belongs to on the About page. */
  group: "legal" | "business";
  /** Post-nominals, where the firm lists them. */
  qualification?: string;
  office?: string;
  /** Bar Council enrolment number. Undefined until the firm confirms it. */
  enrolment?: string;
  /** State Bar Council of enrolment. Undefined until confirmed. */
  stateBar?: string;
  /** Year first enrolled as an advocate. Undefined until confirmed. */
  enrolledSince?: number;
  experience?: string;
  /** Slugs from `practice-areas.ts`. */
  practices?: string[];
  education?: string[];
  /** Presence of a bio is what renders the long-form profile. */
  bio?: string[];
  publications?: string[];
  memberships?: string[];
  email?: string;
  /**
   * Base name in `public/` of the person's portrait, without an extension.
   * Until it is set (and the file exists) the card shows a silhouette.
   */
  photo?: string;
  /**
   * A portrait uploaded from the console (`/api/public/people/.../photo`).
   * Takes precedence over `photo`.
   */
  photoUrl?: string;
  /** Initials used by the portrait placeholder until photography is supplied. */
  initials: string;
  /**
   * The home page "Our people" slide: a short introduction and three
   * credentials under it. Kept apart from `bio`, `education` and
   * `experience` so that sample copy here never shows up as fact on the
   * About page.
   */
  spotlight?: Spotlight;
};

export type Spotlight = {
  summary: string;
  credentials: {
    icon: "degree" | "bar" | "experience";
    title: string;
    detail: string;
  }[];
};

export const people: Person[] = [
  {
    slug: "ganesh-raghavendra",
    name: "Adv. K. L. Ganesh Raghavendra",
    designation: "Founder",
    group: "legal",
    initials: "GR",
    // SAMPLE: stock portrait and placeholder copy. Replace both with the
    // firm's own before launch.
    photo: "person-ganesh-raghavendra",
    spotlight: {
      summary:
        "Leads the firm's litigation and advisory practice, advising businesses and individuals on commercial disputes, corporate matters and regulatory questions before courts and tribunals across South India.",
      credentials: [
        { icon: "degree", title: "LL.B.", detail: "Law Degree" },
        { icon: "bar", title: "Admitted to the Bar", detail: "India" },
        { icon: "experience", title: "15+ Years", detail: "of Experience" },
      ],
    },
  },
  {
    slug: "vidya-sagar",
    name: "Adv. Ch. Vidya Sagar",
    designation: "Senior Associate",
    group: "legal",
    initials: "VS",
    // SAMPLE: stock portrait and placeholder copy.
    photo: "person-vidya-sagar",
    spotlight: {
      summary:
        "Practises in civil and commercial litigation, representing clients before the High Courts, district courts and arbitral tribunals on contract, property and recovery disputes.",
      credentials: [
        { icon: "degree", title: "LL.B.", detail: "Law Degree" },
        { icon: "bar", title: "Admitted to the Bar", detail: "India" },
        { icon: "experience", title: "10+ Years", detail: "of Experience" },
      ],
    },
  },
  {
    slug: "kondal-rao",
    name: "Adv. G. Kondal Rao",
    designation: "Senior Associate",
    group: "legal",
    initials: "KR",
    // SAMPLE: stock portrait and placeholder copy.
    photo: "person-kondal-rao",
    spotlight: {
      summary:
        "Advises on dispute resolution and regulatory matters, handling writ petitions, appeals and statutory proceedings for corporate and individual clients.",
      credentials: [
        { icon: "degree", title: "LL.B.", detail: "Law Degree" },
        { icon: "bar", title: "Admitted to the Bar", detail: "India" },
        { icon: "experience", title: "8+ Years", detail: "of Experience" },
      ],
    },
  },
  {
    slug: "roshini-a",
    name: "Adv. Roshini A.",
    designation: "Associate",
    group: "legal",
    initials: "RA",
  },
  {
    slug: "ritu-neemkar",
    name: "Adv. Ritu Neemkar",
    designation: "Associate",
    group: "legal",
    initials: "RN",
  },
  {
    slug: "sumukh-shastry",
    name: "Adv. Sumukh Shastry",
    designation: "Associate",
    group: "legal",
    initials: "SS",
  },
  {
    slug: "naveen-kumar",
    name: "Adv. P. V. S. Naveen Kumar",
    designation: "Associate",
    group: "legal",
    initials: "NK",
  },
  {
    slug: "n-ramesh",
    name: "Adv. N. Ramesh",
    designation: "Associate",
    group: "legal",
    initials: "NR",
  },
  {
    slug: "n-mohan",
    name: "Adv. N. Mohan",
    designation: "Associate",
    group: "legal",
    initials: "NM",
  },
  {
    slug: "aswin-raj",
    name: "Adv. Aswin Raj",
    designation: "Associate",
    group: "legal",
    initials: "AR",
  },
  {
    slug: "anshu-sharma",
    name: "Adv. Anshu Sharma",
    designation: "Junior Associate",
    group: "legal",
    initials: "AS",
  },

  {
    slug: "krishna-praveen-reddy",
    name: "Adv. B. R. Krishna Praveen Reddy",
    designation: "Director",
    group: "business",
    qualification: "M.Sc., LL.B.",
    initials: "PR",
  },
  {
    slug: "m-venugopal",
    name: "Adv. Dr M. Venugopal",
    designation: "Prominent Consultant",
    group: "business",
    initials: "MV",
  },
  {
    slug: "kishore-kumar",
    name: "Adv. Kishore Kumar D.",
    designation: "Prominent Consultant",
    group: "business",
    initials: "KK",
  },
  {
    slug: "neha-bhuwania",
    name: "Adv. Neha Bhuwania",
    designation: "Prominent Consultant",
    group: "business",
    initials: "NB",
  },
];

export const personBySlug = new Map(people.map((person) => [person.slug, person]));

export function peopleBySlugs(slugs: string[]): Person[] {
  return slugs
    .map((slug) => personBySlug.get(slug))
    .filter((person): person is Person => Boolean(person));
}

export function peopleByGroup(group: Person["group"]): Person[] {
  return people.filter((person) => person.group === group);
}
