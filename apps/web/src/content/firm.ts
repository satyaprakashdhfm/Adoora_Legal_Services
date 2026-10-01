/**
 * Firm-level facts, contact details and site chrome.
 *
 * Everything here is copy the marketing team edits often. Keep it factual:
 * no superlatives, no outcome guarantees, no "best/top" claims (Bar Council
 * of India advertising rules — see `src/content/legal.ts`).
 */

export const firm = {
  name: "ADOORA Legal Services",
  shortName: "ADOORA",
  tagline: "Comprehensive Legal Advisory & Representation",
  descriptor:
    "A full-service law practice advising Indian and international clients on corporate transactions, financing, regulatory cases and dispute resolution.",
  years: "25+",
  regions: "Andhra Pradesh · Karnataka · Telangana",
  /** The three offices, in the order the utility bar lists them. */
  cities: "Hyderabad · Bengaluru · Guntur",

  /* `phone` is the display string; `phoneE164` is the form the structured
     data needs. */
  phone: "+91 91548 25820",
  phoneHref: "tel:+919154825820",
  phoneE164: "+919154825820",
  email: "info@adooralegalservices.com",
  emailHref: "mailto:info@adooralegalservices.com",
  responseTime: "We aim to acknowledge every enquiry within one working day.",

  /* Short lines used as pull quotes on the home page. They describe how the
     firm works; they are not claims about outcomes — see `legal.ts`. */
  heroQuote: "Legal Expertise. Trusted Guidance. Lasting Protection.",
  ctaQuote: "Practical advice. Lasting impact.",
  signOff: "Legal Expertise. Trusted Guidance. Lasting Protection.",

  /**
   * Social profiles, shown in the header's top ribbon, the mobile menu and
   * the footer. Paste each full address, e.g.
   * "https://www.linkedin.com/company/…" — an empty one is not shown.
   */
  linkedin: "",
  instagram: "",
} as const;

/** The firm overview, as the brochure sets it out. */
export const firmOverview = [
  "ADOORA Legal Services is a law firm in South India, with offices in Andhra Pradesh, Karnataka and Telangana. Our lawyers have more than 25 years of experience between them, much of it advising companies.",
  "We know the industries our clients work in, and we give clear advice in time for the decision it is meant to inform.",
  "A large part of our work is keeping companies compliant as the law changes, and helping them through regulatory and contract questions as they come up.",
] as const;

/**
 * Core values, as the brochure sets them out.
 */
export const coreValues = {
  intro:
    "At ADOORA Legal Services, our practice is founded on principles that drive excellence in legal service and client advocacy.",
  values: [
    {
      title: "Integrity",
      body:
        "We uphold the highest ethical standards, ensuring transparency, confidentiality and trust in every legal case.",
    },
    {
      title: "Excellence",
      body:
        "With precision and diligence, we deliver strategic legal solutions that align with our clients' objectives.",
    },
    {
      title: "Innovation",
      body:
        "We embrace forward-thinking legal strategies to navigate evolving regulatory and commercial challenges.",
    },
    {
      title: "Collaboration",
      body:
        "Building lasting client relationships through trust, communication and a deep understanding of legal and business needs.",
    },
  ],
  close:
    "These values define our commitment to delivering exceptional legal counsel and advocacy.",
} as const;

/** Geographical coverage, as the brochure sets it out. */
export const coverage = {
  intro: "The firm's footprint spans key states in South India:",
  places: [
    "Amaravathi, Andhra Pradesh",
    "Hyderabad, Telangana",
    "Bangalore, Karnataka",
  ],
  close:
    "This regional presence ensures that ADOORA Legal Services is equipped to handle local nuances, regulatory requirements and business environments, providing clients with practical, region-specific solutions.",
} as const;

/** The sectors the brochure lists under Industry Focus. */
export const industryFocus = [
  "Technology",
  "Manufacturing",
  "Healthcare",
  "Real Estate & Infrastructure",
  "Financial Services",
  "E-commerce",
  "Retail",
  "Telecommunications",
  "Security Services",
] as const;

/** Key strengths, as the brochure sets them out. */
export const keyStrengths = [
  {
    title: "Regional Expertise",
    body:
      "Extensive knowledge of legal and regulatory frameworks across Andhra Pradesh, Karnataka and Telangana, ensuring precise jurisdictional compliance.",
  },
  {
    title: "Strategic Legal Solutions",
    image: "/why-us-solutions.png",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "62% 50%",
    body:
      "Tailored legal counsel designed to mitigate risks, ensure regulatory adherence and address industry-specific challenges.",
  },
  {
    title: "Proven Legal Expertise",
    image: "/why-us-expertise.png",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "30% 50%",
    body:
      "A highly skilled team of attorneys and legal professionals with extensive experience in corporate law, dispute resolution and compliance.",
  },
  {
    title: "Client-Focused Advocacy",
    body:
      "Dedicated to safeguarding clients' interests through proactive legal representation, strategic advisory and result-oriented solutions.",
  },
] as const;

/** Street addresses as printed in the firm's brochure. */
export const offices = [
  {
    city: "Hyderabad",
    /** For the LocalBusiness JSON-LD's `addressRegion` — not shown on the page. */
    state: "Telangana",
    lines: [
      "SRT 1032, 5th Floor, CZECH Colony",
      "Street No. 5, Sanath Nagar",
      "Hyderabad 500018",
      "Telangana, India",
    ],
    phone: "+91 91548 25820",
    phoneHref: "tel:+919154825820",
  },
  {
    city: "Bengaluru",
    state: "Karnataka",
    lines: [
      "2nd Floor, Juice Junction Building",
      "2nd Block, 9th Main Road, Jayanagar East",
      "Bengaluru 560011",
      "Karnataka, India",
    ],
    phone: "+91 91548 25820",
    phoneHref: "tel:+919154825820",
  },
  {
    city: "Guntur",
    state: "Andhra Pradesh",
    lines: [
      "D. No. 4-5-62, Sai Baba Road",
      "Chandramouli Nagar",
      "Guntur 522007",
      "Andhra Pradesh, India",
    ],
    phone: "+91 91548 25820",
    phoneHref: "tel:+919154825820",
  },
] as const;

/**
 * Why clients work with us.
 *
 * This replaced a list of recognitions. The entries that were here (ALB,
 * Chambers, Legal 500, ET, IBLJ) came from the original brief as examples
 * and were not the firm's own, so they were published claims the firm could
 * not substantiate. They have been removed.
 *
 * What sits here instead has to stay on the right side of the Bar Council
 * of India rules on advertising: no superlatives, no ranking claims, no
 * comparison with other firms. Every line below is a statement about how
 * the firm works that a client could hold us to.
 *
 * When real recognitions exist, list them factually with the year and the
 * awarding body — the template for that is in this file's history.
 */
export const differentiators = [
  {
    title: "Proven Legal Expertise",
    image: "/approach-scales1.jpg",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "68% 50%",
    body:
      "Experience in corporate law, mergers and acquisitions, and cases where a great deal is at stake.",
  },
  {
    title: "Client-First Approach",
    image: "/approach-client-first1.jpg",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "45% 50%",
    body:
      "We explain what we are doing, reply promptly and put your interests first.",
  },
  {
    title: "Connected Client Experience",
    image: "/approach-connected1.jpg",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "45% 50%",
    body: "Your case updates, documents and messages are together in the client portal.",
  },
  {
    title: "Cross-Border & Regulatory Mastery",
    image: "/approach-cross-border1.jpg",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "35% 50%",
    body:
      "Experience with international transactions and with local compliance rules.",
  },
  {
    title: "Strategic Legal Solutions",
    image: "/approach-solutions1.jpg",
    /* Square source; the panel is near-square on desktop and 3:2 on
       phones, so this keeps the subject in shot either way. */
    focus: "55% 50%",
    body:
      "Practical advice that fits how your business runs and where it is heading.",
  },
] as const;

export type Differentiator = (typeof differentiators)[number];
export type Office = (typeof offices)[number];
