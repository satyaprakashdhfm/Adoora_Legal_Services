export const firm = {
  name: "ADOORA Legal Services",
  short: "ADOORA",
  tagline: "Comprehensive Legal Advisory & Representation",
  years: "25+",
  phone: "9154825820",
  phoneHref: "tel:+919154825820",
  overview:
    "ADOORA Legal Services is a preeminent law firm, with 25+ years of collective team experience, specializing in corporate legal solutions across South India, with a well-established presence in Andhra Pradesh, Karnataka and Telangana.",
} as const;

export const stats = [
  { value: "25+", label: "Years of collective experience" },
  { value: "3", label: "States across South India" },
  { value: "9", label: "Core practice areas" },
] as const;

export const practiceAreas = [
  {
    title: "Corporate Law",
    description:
      "Mergers and acquisitions, joint ventures, corporate governance, regulatory compliance and business structuring.",
  },
  {
    title: "Litigation & Dispute Resolution",
    description:
      "Commercial disputes, arbitration and mediation before High Courts, Tribunals and other adjudicatory bodies.",
  },
  {
    title: "Labour & Employment Law",
    description:
      "Employment regulations, industrial relations, workplace disputes, and disciplinary and POSH inquiries.",
  },
  {
    title: "Intellectual Property Law",
    description:
      "Protection, enforcement and commercialization of patents, trademarks, copyrights and trade secrets.",
  },
  {
    title: "Real Estate & Construction",
    description:
      "Land acquisitions, property transactions, construction contracts, approvals and project dispute resolution.",
  },
  {
    title: "Taxation & Compliance",
    description:
      "Strategic advisory on corporate taxation, GST and regulatory compliance across jurisdictions.",
  },
  {
    title: "Banking & Finance Law",
    description:
      "Structuring financial transactions, loan agreements, debt recovery, securitization and banking compliance.",
  },
  {
    title: "Regulatory & Environmental",
    description:
      "Regulatory frameworks, environmental compliance, sustainability practices and government policy.",
  },
  {
    title: "Advisory & Representation",
    description:
      "End-to-end counsel ensuring regulatory compliance, risk mitigation and strategic legal solutions.",
  },
] as const;

export const offices = [
  {
    city: "Bangalore",
    state: "Karnataka",
    address: ["Juice Junction Building", "2nd Block, Jaya Nagar East", "Bengaluru, Karnataka 560011"],
  },
  {
    city: "Hyderabad",
    state: "Telangana",
    address: [
      "2nd Floor, Silver Square Building",
      "Road No. 36, Aditya Enclave",
      "Jubilee Hills, Hyderabad 500033",
    ],
  },
  {
    city: "Guntur",
    state: "Andhra Pradesh",
    address: ["Opp. D.No 4-5-62", "Sai Baba Road, Chandramouli Nagar", "Guntur 522007"],
  },
] as const;

export const values = [
  { title: "Integrity", description: "The highest ethical standards — transparency, confidentiality and trust." },
  { title: "Excellence", description: "Precise, diligent legal solutions aligned to our clients' objectives." },
  { title: "Innovation", description: "Forward-thinking strategies for evolving regulatory challenges." },
  { title: "Collaboration", description: "Lasting relationships built on communication and understanding." },
] as const;
