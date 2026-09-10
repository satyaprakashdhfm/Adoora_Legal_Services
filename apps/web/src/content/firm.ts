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
    email: "hyderabad@adooralegalservices.com",
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
    email: "bengaluru@adooralegalservices.com",
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
    email: "guntur@adooralegalservices.com",
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
 * Recognitions, listed factually with the year and the awarding body.
 * Superlatives appear only where they are part of the award title itself.
 */
export const awards = [
  {
    year: "2026",
    body: "Asian Legal Business",
    title: "ALB India Firms to Watch 2026",
    detail: 'Recognised amongst "Firms to Watch in 2026" by Asian Legal Business.',
  },
  {
    year: "2026",
    body: "Asian Legal Business",
    title: "ALB India Law Awards 2026",
    detail: "Winner: Emerging Markets Law Firm of the Year.",
  },
  {
    year: "2026",
    body: "Benchmark Litigation",
    title: "Benchmark Litigation Asia-Pacific Rankings 2026",
    detail:
      'Recognised across three practice areas; "Highly Recommended Firm" in Hyderabad.',
  },
  {
    year: "2026",
    body: "Chambers and Partners",
    title: "Chambers and Partners Asia Pacific 2026",
    detail:
      "Band 1 in Corporate/Commercial: Hyderabad; ranked in Dispute Resolution.",
  },
  {
    year: "2025",
    body: "The Economic Times",
    title: "ET Global Legal Awards 2025",
    detail:
      "Winner: Regional Law Firm of the Year – Hyderabad (3rd edition, 2025–26).",
  },
  {
    year: "2025",
    body: "India Business Law Journal",
    title: "IBLJ Deals of the Year 2025",
    detail:
      "Two deals recognised: RUSAL's three-stage investment in Pioneer Aluminium (USD 468.7m); and APCRDA's financing from NaBFID for the Amaravati Capital City development (USD 811m).",
  },
  {
    year: "2026",
    body: "India Business Law Journal",
    title: "IBLJ Regional Law Firm Awards 2026",
    detail:
      "Winner in Arbitration & ADR, Finance, Real Estate, and Technology (Hyderabad).",
  },
  {
    year: "2026",
    body: "The Legal 500",
    title: "The Legal 500 – Asia Pacific 2026",
    detail:
      "Top Tier Firm in Hyderabad; ranked across four practice areas including Banking & Finance, Corporate & M&A, and Labour & Employment.",
  },
] as const;

export type Award = (typeof awards)[number];
export type Office = (typeof offices)[number];
