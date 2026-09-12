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
    "A full-service law practice advising Indian and international clients on corporate transactions, financing, regulatory matters and dispute resolution.",
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
  heroQuote: "Sound legal counsel for a stronger tomorrow.",
  ctaQuote: "Practical advice. Lasting impact.",
  signOff: "Sound counsel for what's next.",

  /** Left empty until the firm confirms the handle; the footer hides it. */
  linkedin: "",
} as const;

/** The firm overview, as the brochure sets it out. */
export const firmOverview = [
  "ADOORA Legal Services is a preeminent law firm, with 25+ years of collective team experience, specializing in corporate legal solutions across South India, with a well-established presence in Andhra Pradesh, Karnataka and Telangana.",
  "With a team of highly skilled legal professionals and extensive industry expertise, the firm is committed to delivering precise, strategic and time-sensitive legal counsel.",
  "ADOORA Legal Services is dedicated to ensuring corporate clients remain compliant with evolving legal frameworks while effectively navigating complex regulatory and contractual landscapes.",
] as const;

/** Street addresses as printed in the firm's brochure. */
export const offices = [
  {
    city: "Hyderabad",
    label: "Principal office",
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
    label: "Karnataka",
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
    label: "Andhra Pradesh",
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

/** Factual counters for the trust strip. No rankings, no self-praise. */
export const stats = [
  { value: "25+", label: "Years of combined practice" },
  { value: "3", label: "Offices across South India" },
  { value: "8", label: "Practice areas" },
  { value: "8", label: "Industry domains" },
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
    body:
      "A strong track record in corporate law, M&A, and high-stakes legal matters.",
  },
  {
    title: "Client-First Approach",
    body:
      "Transparent, responsive, and committed to protecting your interests.",
  },
  {
    title: "Cross-Border & Regulatory Mastery",
    body:
      "Expertise in international transactions and regional compliance.",
  },
  {
    title: "Strategic Legal Solutions",
    body:
      "Practical, business-aligned counsel for sustainable growth.",
  },
] as const;

export type Differentiator = (typeof differentiators)[number];
export type Office = (typeof offices)[number];
