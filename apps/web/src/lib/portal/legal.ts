/**
 * Reference data for recording Indian cases: forums, High Courts and their
 * benches, the case-type abbreviations courts use on their cause lists, and
 * labels for the API's enums.
 *
 * Case types are suggestions, not a closed list. Every High Court keeps its
 * own register of abbreviations (Telangana's "WP" is Delhi's "W.P.(C)"), so
 * the form offers these and accepts whatever the court actually wrote.
 */

export const COURT_LEVELS = [
  { value: "SUPREME_COURT", label: "Supreme Court of India" },
  { value: "HIGH_COURT", label: "High Court" },
  { value: "DISTRICT_COURT", label: "District / Sessions Court" },
  { value: "SUBORDINATE_COURT", label: "Civil Judge / Magistrate Court" },
  { value: "FAMILY_COURT", label: "Family Court" },
  { value: "COMMERCIAL_COURT", label: "Commercial Court" },
  { value: "TRIBUNAL", label: "Tribunal (NCLT, NCLAT, DRT, ITAT, NGT, CAT…)" },
  { value: "CONSUMER_COMMISSION", label: "Consumer Commission" },
  { value: "ARBITRATION", label: "Arbitral Tribunal" },
  { value: "QUASI_JUDICIAL", label: "Regulator / Statutory Authority" },
  { value: "NOT_IN_LITIGATION", label: "Not in litigation (advisory)" },
  { value: "OTHER", label: "Other forum" },
] as const;

export type HighCourt = {
  name: string;
  /** States and UTs within its jurisdiction. */
  jurisdiction: string;
  seats: string[];
};

/** The 25 High Courts, with the principal seat listed first. */
export const HIGH_COURTS: HighCourt[] = [
  { name: "High Court of Judicature at Allahabad", jurisdiction: "Uttar Pradesh", seats: ["Principal Seat at Prayagraj", "Bench at Lucknow"] },
  { name: "High Court of Andhra Pradesh", jurisdiction: "Andhra Pradesh", seats: ["Principal Seat at Amaravati"] },
  { name: "High Court of Judicature at Bombay", jurisdiction: "Maharashtra, Goa, Dadra & Nagar Haveli and Daman & Diu", seats: ["Principal Seat at Mumbai", "Bench at Nagpur", "Bench at Aurangabad", "Bench at Goa", "Bench at Kolhapur"] },
  { name: "High Court at Calcutta", jurisdiction: "West Bengal, Andaman & Nicobar Islands", seats: ["Principal Seat at Kolkata", "Circuit Bench at Port Blair", "Circuit Bench at Jalpaiguri"] },
  { name: "High Court of Chhattisgarh", jurisdiction: "Chhattisgarh", seats: ["Principal Seat at Bilaspur"] },
  { name: "High Court of Delhi", jurisdiction: "National Capital Territory of Delhi", seats: ["New Delhi"] },
  { name: "Gauhati High Court", jurisdiction: "Assam, Nagaland, Mizoram, Arunachal Pradesh", seats: ["Principal Seat at Guwahati", "Kohima Bench", "Aizawl Bench", "Itanagar Bench"] },
  { name: "High Court of Gujarat", jurisdiction: "Gujarat", seats: ["Principal Seat at Ahmedabad"] },
  { name: "High Court of Himachal Pradesh", jurisdiction: "Himachal Pradesh", seats: ["Principal Seat at Shimla"] },
  { name: "High Court of Jammu & Kashmir and Ladakh", jurisdiction: "Jammu & Kashmir, Ladakh", seats: ["Srinagar Wing", "Jammu Wing"] },
  { name: "High Court of Jharkhand", jurisdiction: "Jharkhand", seats: ["Principal Seat at Ranchi"] },
  { name: "High Court of Karnataka", jurisdiction: "Karnataka", seats: ["Principal Seat at Bengaluru", "Dharwad Bench", "Kalaburagi Bench"] },
  { name: "High Court of Kerala", jurisdiction: "Kerala, Lakshadweep", seats: ["Principal Seat at Ernakulam, Kochi"] },
  { name: "High Court of Madhya Pradesh", jurisdiction: "Madhya Pradesh", seats: ["Principal Seat at Jabalpur", "Bench at Indore", "Bench at Gwalior"] },
  { name: "High Court of Judicature at Madras", jurisdiction: "Tamil Nadu, Puducherry", seats: ["Principal Seat at Chennai", "Madurai Bench"] },
  { name: "High Court of Manipur", jurisdiction: "Manipur", seats: ["Principal Seat at Imphal"] },
  { name: "High Court of Meghalaya", jurisdiction: "Meghalaya", seats: ["Principal Seat at Shillong"] },
  { name: "Orissa High Court", jurisdiction: "Odisha", seats: ["Principal Seat at Cuttack"] },
  { name: "Patna High Court", jurisdiction: "Bihar", seats: ["Principal Seat at Patna"] },
  { name: "High Court of Punjab and Haryana", jurisdiction: "Punjab, Haryana, Chandigarh", seats: ["Principal Seat at Chandigarh"] },
  { name: "Rajasthan High Court", jurisdiction: "Rajasthan", seats: ["Principal Seat at Jodhpur", "Bench at Jaipur"] },
  { name: "High Court of Sikkim", jurisdiction: "Sikkim", seats: ["Principal Seat at Gangtok"] },
  { name: "High Court for the State of Telangana", jurisdiction: "Telangana", seats: ["Principal Seat at Hyderabad"] },
  { name: "High Court of Tripura", jurisdiction: "Tripura", seats: ["Principal Seat at Agartala"] },
  { name: "High Court of Uttarakhand", jurisdiction: "Uttarakhand", seats: ["Principal Seat at Nainital"] },
];

export type CaseType = { code: string; name: string };

/** Common case-type abbreviations, by forum. */
export const CASE_TYPES: Record<string, CaseType[]> = {
  SUPREME_COURT: [
    { code: "SLP(C)", name: "Special Leave Petition (Civil)" },
    { code: "SLP(Crl)", name: "Special Leave Petition (Criminal)" },
    { code: "C.A.", name: "Civil Appeal" },
    { code: "Crl.A.", name: "Criminal Appeal" },
    { code: "W.P.(C)", name: "Writ Petition (Civil) — Article 32" },
    { code: "W.P.(Crl)", name: "Writ Petition (Criminal) — Article 32" },
    { code: "T.P.(C)", name: "Transfer Petition (Civil)" },
    { code: "T.P.(Crl)", name: "Transfer Petition (Criminal)" },
    { code: "R.P.", name: "Review Petition" },
    { code: "Cur.P.", name: "Curative Petition" },
    { code: "Cont.P.", name: "Contempt Petition" },
    { code: "Diary No.", name: "Diary number (before registration)" },
  ],
  HIGH_COURT: [
    { code: "WP", name: "Writ Petition — Article 226" },
    { code: "WP(PIL)", name: "Public Interest Litigation" },
    { code: "WP(HC)", name: "Habeas Corpus Petition" },
    { code: "WA", name: "Writ Appeal" },
    { code: "LPA", name: "Letters Patent Appeal" },
    { code: "AS", name: "Appeal Suit / First Appeal" },
    { code: "SA", name: "Second Appeal" },
    { code: "CRP", name: "Civil Revision Petition" },
    { code: "CMA", name: "Civil Miscellaneous Appeal" },
    { code: "CRL.P", name: "Criminal Petition (incl. quashing — s. 528 BNSS / s. 482 CrPC)" },
    { code: "CRL.A", name: "Criminal Appeal" },
    { code: "CRL.RC", name: "Criminal Revision Case" },
    { code: "BA", name: "Bail Application" },
    { code: "ABA", name: "Anticipatory Bail Application" },
    { code: "CC", name: "Contempt Case" },
    { code: "ARB.P", name: "Arbitration Petition (s. 9 / 11 / 34)" },
    { code: "COMCA", name: "Commercial Court Appeal" },
    { code: "COMP.A", name: "Company Appeal" },
    { code: "ITTA", name: "Income Tax Tribunal Appeal" },
    { code: "TP", name: "Transfer Petition" },
    { code: "RP", name: "Review Petition" },
    { code: "EP", name: "Election Petition" },
    { code: "IA", name: "Interlocutory Application" },
  ],
  DISTRICT_COURT: [
    { code: "OS", name: "Original Suit" },
    { code: "AS", name: "Appeal Suit" },
    { code: "OP", name: "Original Petition" },
    { code: "EP", name: "Execution Petition" },
    { code: "SC", name: "Sessions Case" },
    { code: "CRL.A", name: "Criminal Appeal" },
    { code: "CRL.RP", name: "Criminal Revision Petition" },
    { code: "CRL.MP", name: "Criminal Miscellaneous Petition (bail)" },
    { code: "MACOP", name: "Motor Accident Claims OP" },
    { code: "IA", name: "Interlocutory Application" },
  ],
  SUBORDINATE_COURT: [
    { code: "OS", name: "Original Suit" },
    { code: "CC", name: "Calendar Case" },
    { code: "CC (NI Act)", name: "Cheque dishonour — s. 138 NI Act" },
    { code: "STC", name: "Summary Trial Case" },
    { code: "PRC", name: "Preliminary Register Case" },
    { code: "MC", name: "Maintenance Case" },
    { code: "DVC", name: "Domestic Violence Case" },
    { code: "EP", name: "Execution Petition" },
    { code: "IA", name: "Interlocutory Application" },
  ],
  FAMILY_COURT: [
    { code: "FCOP", name: "Family Court Original Petition (divorce, custody)" },
    { code: "MC", name: "Maintenance Case" },
    { code: "GWOP", name: "Guardians & Wards OP" },
    { code: "IA", name: "Interlocutory Application" },
  ],
  COMMERCIAL_COURT: [
    { code: "COS", name: "Commercial Original Suit" },
    { code: "CS(COMM)", name: "Commercial Suit" },
    { code: "ARB.OP", name: "Arbitration OP (s. 34 challenge)" },
    { code: "EP", name: "Execution Petition" },
    { code: "IA", name: "Interlocutory Application" },
  ],
  TRIBUNAL: [
    { code: "CP (IB)", name: "Company Petition — Insolvency & Bankruptcy Code" },
    { code: "CP", name: "Company Petition — Companies Act" },
    { code: "IA", name: "Interlocutory Application" },
    { code: "CA (AT)", name: "Company Appeal (NCLAT)" },
    { code: "OA", name: "Original Application (DRT / CAT / NGT)" },
    { code: "SA", name: "Securitisation Application (DRT)" },
    { code: "ITA", name: "Income Tax Appeal (ITAT)" },
    { code: "Appeal", name: "Appeal" },
  ],
  CONSUMER_COMMISSION: [
    { code: "CC", name: "Consumer Complaint" },
    { code: "FA", name: "First Appeal" },
    { code: "RP", name: "Revision Petition" },
    { code: "EA", name: "Execution Application" },
  ],
  ARBITRATION: [
    { code: "Arb. Case", name: "Arbitration proceeding" },
  ],
  QUASI_JUDICIAL: [
    { code: "Complaint", name: "Complaint" },
    { code: "Appeal", name: "Appeal" },
    { code: "SCN", name: "Show-cause notice proceedings" },
  ],
};

export const STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

export const CASE_STATUSES = [
  { value: "INTAKE", label: "Intake" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "DISPOSED", label: "Disposed" },
  { value: "CLOSED", label: "Closed" },
  { value: "WITHDRAWN", label: "Withdrawn" },
] as const;

export const CASE_STAGES = [
  { value: "PRE_FILING", label: "Pre-filing" },
  { value: "FILED", label: "Filed" },
  { value: "UNDER_SCRUTINY", label: "Under scrutiny" },
  { value: "DEFECTS_NOTIFIED", label: "Defects notified" },
  { value: "REGISTERED", label: "Registered" },
  { value: "ADMISSION", label: "Admission" },
  { value: "NOTICE_ISSUED", label: "Notice issued" },
  { value: "PLEADINGS", label: "Pleadings" },
  { value: "EVIDENCE", label: "Evidence" },
  { value: "ARGUMENTS", label: "Arguments" },
  { value: "RESERVED_FOR_ORDERS", label: "Reserved for orders" },
  { value: "DISPOSED", label: "Disposed" },
] as const;

export const PARTY_ROLES = [
  { value: "PETITIONER", label: "Petitioner" },
  { value: "RESPONDENT", label: "Respondent" },
  { value: "APPELLANT", label: "Appellant" },
  { value: "APPLICANT", label: "Applicant" },
  { value: "PLAINTIFF", label: "Plaintiff" },
  { value: "DEFENDANT", label: "Defendant" },
  { value: "COMPLAINANT", label: "Complainant" },
  { value: "ACCUSED", label: "Accused" },
  { value: "OPPOSITE_PARTY", label: "Opposite Party" },
  { value: "INTERVENOR", label: "Intervenor" },
  { value: "OTHER", label: "Other" },
] as const;

/** Which side of the "v." a role sits on, for the cause title. */
export const FIRST_SIDE = new Set(["PETITIONER", "APPELLANT", "APPLICANT", "PLAINTIFF", "COMPLAINANT"]);
export const SECOND_SIDE = new Set(["RESPONDENT", "DEFENDANT", "ACCUSED", "OPPOSITE_PARTY"]);

export const DOCUMENT_CATEGORIES = [
  { value: "PETITION", label: "Petition / plaint / application" },
  { value: "PLEADING", label: "Pleading (counter, reply, rejoinder)" },
  { value: "AFFIDAVIT", label: "Affidavit" },
  { value: "VAKALATNAMA", label: "Vakalatnama" },
  { value: "EVIDENCE", label: "Evidence / exhibit" },
  { value: "ORDER", label: "Order" },
  { value: "JUDGMENT", label: "Judgment" },
  { value: "NOTICE", label: "Notice" },
  { value: "CORRESPONDENCE", label: "Correspondence" },
  { value: "AGREEMENT", label: "Agreement / contract" },
  { value: "IDENTITY", label: "Identity / KYC" },
  { value: "FINANCIAL", label: "Financial record" },
  { value: "OTHER", label: "Other" },
] as const;

export const UPDATE_KINDS = [
  { value: "NOTE", label: "Note" },
  { value: "HEARING", label: "Hearing" },
  { value: "ORDER", label: "Order passed" },
  { value: "FILING", label: "Filing" },
] as const;

export const ACCEPTED_UPLOADS =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.rtf,.txt,.csv,.jpg,.jpeg,.png,.webp,.tif,.tiff";

export function labelFor(list: readonly { value: string; label: string }[], value: string | null | undefined) {
  return list.find((item) => item.value === value)?.label ?? value ?? "";
}
