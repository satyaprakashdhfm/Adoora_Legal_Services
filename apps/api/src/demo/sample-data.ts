import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { placeKey, placementFields } from "../lib/places.js";
import { logger } from "../logger.js";
import { encryptDocument, sha256 } from "../lib/crypto.js";
import { storage } from "../storage/index.js";
import type { DocumentCategory, Visibility } from "../../generated/prisma/client.js";

/**
 * Sample data, so every section of the console, the lawyer workspace and the
 * client dashboard has something in it when the firm is shown the system.
 *
 * Everything is FICTIONAL and marked so it can all be taken out in one go:
 *
 *   people     emails @demo.adoora.test, names end "(Demo)"
 *   cases      references ALS-2026-DEMX01 … DEMX06, titles start "[Demo]"
 *   documents  on those cases, plus ALS-TEAM-DEMX01 in the firm-wide Internal
 *   queries    QRY-DEMX…      enquiries  ENQ-DEMX…
 *   jobs       slugs demo-…   applications APP-DEMX…
 *   profiles   slugs demo-…   (never shown on the website)
 *
 * No case has a CNR, so nothing is ever looked up on a court website or
 * billed by eCourtsIndia. Adding is idempotent; removing deletes only what
 * carries these marks.
 */

export const DEMO_DOMAIN = "demo.adoora.test";
const CASE_REFS = ["ALS-2026-DEMX01", "ALS-2026-DEMX02", "ALS-2026-DEMX03", "ALS-2026-DEMX04", "ALS-2026-DEMX05", "ALS-2026-DEMX06"] as const;
const TEAM_DOC_REF = "ALS-TEAM-DEMX01";
const demoEmail = (local: string) => `${local}@${DEMO_DOMAIN}`;

const day = (offset: number) => {
  const today = new Date(new Date().toISOString().slice(0, 10));
  return new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
};

/** A one-page PDF with a few lines of text — enough to open and read. */
function pdf(lines: string[]): Buffer {
  const escape = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const text = ["BT", "/F1 12 Tf", "72 760 Td", "16 TL", ...lines.map((line) => `(${escape(line)}) Tj T*`), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

async function storeVersion(prefix: string, filename: string, bytes: Buffer) {
  const encrypted = encryptDocument(bytes);
  const storageKey = `${prefix}/${randomUUID()}`;
  await storage.put(storageKey, encrypted.ciphertext, "application/octet-stream");
  return {
    version: 1,
    storageKey,
    storageDriver: storage.name,
    filename,
    mimeType: "application/pdf",
    sizeBytes: bytes.length,
    sha256: sha256(bytes),
    encKeyId: encrypted.encKeyId,
    wrappedKey: encrypted.wrappedKey,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  };
}

type DemoDoc = {
  title: string;
  category: DocumentCategory;
  visibility: Visibility;
  file: string;
  lines: string[];
  byClientId?: string;
  byUserId?: string | null;
  fromCourt?: boolean;
  /** A court paper the firm uploaded itself: in From court, not fetched. */
  inCourtFolder?: boolean;
  folderId?: string;
};

/** Files a document on a case (or the firm-wide Internal, with no caseId) and returns its id. */
async function addDocument(caseRow: { id: string; reference: string } | null, seq: number, doc: DemoDoc) {
  const version = await storeVersion(caseRow ? `cases/${caseRow.id}` : "team", doc.file, pdf(["DEMO DOCUMENT - FICTIONAL", "", ...doc.lines]));
  const who = doc.byClientId ? { uploadedByClientId: doc.byClientId } : { uploadedByUserId: doc.byUserId ?? null };
  const created = await prisma.document.create({
    data: {
      reference: caseRow ? `${caseRow.reference}-D${String(seq).padStart(3, "0")}` : TEAM_DOC_REF,
      caseId: caseRow?.id ?? null,
      seq,
      title: doc.title,
      category: doc.category,
      ...placementFields([placeKey(doc.visibility === "INTERNAL" ? "INTERNAL" : doc.fromCourt || doc.inCourtFolder ? "COURT" : "CLIENT", doc.folderId)]),
      fromCourt: doc.fromCourt ?? false,
      ...who,
      versions: { create: { ...version, ...who } },
    },
    select: { id: true },
  });
  return created.id;
}

/** What is there now, for the console's Sample data card. */
export async function sampleDataStatus() {
  const [cases, clients, staff, jobs, applications, enquiries] = await Promise.all([
    prisma.case.count({ where: { reference: { in: [...CASE_REFS] } } }),
    prisma.client.count({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } }),
    prisma.user.count({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } }),
    prisma.jobOpening.count({ where: { slug: { startsWith: "demo-" } } }),
    prisma.careerApplication.count({ where: { reference: { startsWith: "APP-DEMX" } } }),
    prisma.enquiry.count({ where: { reference: { startsWith: "ENQ-DEMX" } } }),
  ]);
  return { cases, clients, staff, jobs, applications, enquiries, present: cases + clients + staff + jobs + applications + enquiries > 0 };
}

export async function removeSampleData() {
  const cases = await prisma.case.findMany({ where: { reference: { in: [...CASE_REFS] } }, select: { id: true } });
  const caseIds = cases.map((c) => c.id);
  const docWhere = { OR: [{ caseId: { in: caseIds } }, { reference: TEAM_DOC_REF }] };
  const versions = await prisma.documentVersion.findMany({ where: { document: docWhere }, select: { storageKey: true } });

  await prisma.courtOrder.updateMany({ where: { caseId: { in: caseIds } }, data: { documentId: null } });
  await prisma.document.deleteMany({ where: docWhere });
  await prisma.clientQuery.deleteMany({ where: { OR: [{ caseId: { in: caseIds } }, { reference: { startsWith: "QRY-DEMX" } }] } });
  await prisma.case.deleteMany({ where: { id: { in: caseIds } } });
  await prisma.lawyerProfile.deleteMany({ where: { slug: { startsWith: "demo-" } } });
  const clients = await prisma.client.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });
  const staff = await prisma.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });
  const jobs = await prisma.jobOpening.deleteMany({ where: { slug: { startsWith: "demo-" } } });
  const applications = await prisma.careerApplication.deleteMany({ where: { reference: { startsWith: "APP-DEMX" } } });
  const enquiries = await prisma.enquiry.deleteMany({ where: { reference: { startsWith: "ENQ-DEMX" } } });
  for (const version of versions) await storage.delete(version.storageKey).catch(() => undefined);

  const summary = {
    cases: caseIds.length,
    files: versions.length,
    clients: clients.count,
    staff: staff.count,
    jobs: jobs.count,
    applications: applications.count,
    enquiries: enquiries.count,
  };
  logger.info(summary, "Sample data removed");
  return summary;
}

/**
 * Adds whatever part of the sample set is missing. `clientEmail` (optional)
 * is an extra, real client account to link the first two sample cases to —
 * for example your own, to see the client dashboard with data in it.
 */
/**
 * The firm's people trying the portals out (migration 20261009000000_test_access):
 * the first two sample cases on their client accounts, the first three
 * assigned to them in the lawyer workspace. The migration links them when the
 * sample data is already there; this does it when it is added later.
 */
const TEST_ACCESS_EMAILS = ["info@adooralegalservices.com", "surya.test@adoora.invalid", "pradeep.test@adoora.invalid", "anshu.test@adoora.invalid"];

async function linkTestAccess() {
  const cases = await prisma.case.findMany({ where: { reference: { in: [...CASE_REFS.slice(0, 3)] } }, select: { id: true, reference: true } });
  const [clients, users] = await Promise.all([
    prisma.client.findMany({ where: { email: { in: TEST_ACCESS_EMAILS } }, select: { id: true } }),
    prisma.user.findMany({ where: { email: { in: TEST_ACCESS_EMAILS } }, select: { id: true } }),
  ]);
  const forClients = cases.filter((c) => c.reference !== CASE_REFS[2]);
  await prisma.caseClient.createMany({ data: clients.flatMap((cl) => forClients.map((c) => ({ caseId: c.id, clientId: cl.id }))), skipDuplicates: true });
  await prisma.caseAssignment.createMany({ data: users.flatMap((u) => cases.map((c) => ({ caseId: c.id, userId: u.id }))), skipDuplicates: true });
}

export async function addSampleData(clientEmail?: string) {
  if (await prisma.case.findFirst({ where: { reference: KEPT_CASE }, select: { id: true } })) {
    return { added: false, message: "The sample case is already there. Remove it first to add it again." };
  }
  // Leftovers of an earlier sample: replace them.
  if ((await sampleDataStatus()).present) await removeSampleData();

  // --- The team: three sample lawyers, not shown on the website -----------
  const lawyerSpecs = [
    { local: "kavya.reddy", name: "Adv. Kavya Reddy (Demo)", designation: "Senior Associate", phone: "+91 90000 00001", enrolment: "TS/1021/2014", practices: ["litigation", "real-estate-infrastructure"] },
    { local: "arjun.varma", name: "Adv. Arjun Varma (Demo)", designation: "Associate", phone: "+91 90000 00002", enrolment: "TS/2210/2019", practices: ["dispute-resolution", "labour-employment"] },
    { local: "sneha.iyer", name: "Adv. Sneha Iyer (Demo)", designation: "Associate — Corporate", phone: "+91 90000 00003", enrolment: "KAR/3312/2020", practices: ["corporate-ma", "taxation"] },
  ];
  const lawyers: { id: string }[] = [];
  for (const [index, spec] of lawyerSpecs.entries()) {
    const user = await prisma.user.create({
      data: { email: demoEmail(spec.local), name: spec.name, role: "LAWYER", phone: spec.phone, barEnrolment: spec.enrolment },
      select: { id: true },
    });
    await prisma.lawyerProfile.create({
      data: {
        slug: `demo-${spec.local.replace(".", "-")}`,
        name: spec.name,
        designation: spec.designation,
        group: "LEGAL",
        enrolment: spec.enrolment,
        phone: spec.phone,
        email: demoEmail(spec.local),
        office: "Hyderabad",
        practices: spec.practices,
        published: false,
        sortOrder: 900 + index,
        userId: user.id,
      },
    });
    lawyers.push(user);
  }
  const [kavya, arjun, sneha] = lawyers as [{ id: string }, { id: string }, { id: string }];

  // --- Clients -------------------------------------------------------------
  const client = (email: string, data: { name: string; kind?: "INDIVIDUAL" | "ORGANISATION"; organisation?: string; phone?: string; address?: string }) =>
    prisma.client.create({ data: { email, kind: data.kind ?? "INDIVIDUAL", ...data }, select: { id: true } });
  const ananya = await client(demoEmail("ananya.rao"), { name: "Ananya Rao (Demo)", phone: "+91 90000 10001" });
  const sunrise = await client(demoEmail("accounts.sunrise"), {
    name: "Ravi Teja (Demo)",
    kind: "ORGANISATION",
    organisation: "Sunrise Textiles Pvt. Ltd. (Demo)",
    phone: "+91 90000 10002",
    address: "Plot 14, Industrial Area Phase II, Cherlapally, Hyderabad 500051 (Demo)",
  });
  const priya = await client(demoEmail("priya.menon"), { name: "Priya Menon (Demo)", phone: "+91 90000 10003" });
  // Signed up, no case linked yet — shows the "contact us" state.
  await client(demoEmail("irfan.m"), { name: "Mohammed Irfan (Demo)", phone: "+91 90000 10004" });

  const real = clientEmail ? await prisma.client.findUnique({ where: { email: clientEmail.toLowerCase() }, select: { id: true } }) : null;
  const linkAnanya = { create: [{ clientId: ananya.id }, ...(real ? [{ clientId: real.id }] : [])] };

  // --- Case 1: a writ petition in the High Court -----------------------------
  const writ = await prisma.case.create({
    data: {
      reference: CASE_REFS[0],
      title: "[Demo] Sri Lakshmi Traders v. Greater City Development Authority",
      summary: "DEMO DATA — fictional. Writ petition challenging the cancellation of a trade licence without notice or hearing. Interim protection sought against sealing of the premises pending disposal.",
      practiceArea: "litigation",
      status: "ACTIVE",
      stage: "NOTICE_ISSUED",
      courtLevel: "HIGH_COURT",
      courtName: "High Court for the State of Telangana",
      bench: "Principal Seat at Hyderabad",
      state: "Telangana",
      courtHall: "Court Hall 12",
      coram: "Hon'ble Justice (Demo) A. Rao",
      caseTypeCode: "WP",
      caseTypeName: "Writ Petition",
      caseNumber: "4521",
      caseYear: 2026,
      filingNumber: "WP/SR/10877/2026",
      filingDate: day(-62),
      registrationDate: day(-58),
      actsAndSections: ["Article 226, Constitution of India", "Article 14, Constitution of India"],
      reliefSought: "Writ of certiorari quashing the cancellation order; interim stay of sealing.",
      lastHearingDate: day(-9),
      nextHearingDate: day(12),
      nextHearingPurpose: "Counter affidavit / hearing",
      courtStatus: "Pending",
      courtStage: "NOTICE",
      createdById: kavya.id,
      parties: {
        createMany: {
          data: [
            { role: "PETITIONER", position: 1, name: "Sri Lakshmi Traders, rep. by its Proprietor (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "RESPONDENT", position: 1, name: "Greater City Development Authority, rep. by its Commissioner (Demo)", isClient: false, counsel: "Standing Counsel (Demo)" },
            { role: "RESPONDENT", position: 2, name: "State of Telangana, rep. by its Principal Secretary, MA&UD (Demo)", isClient: false, counsel: "Government Pleader (Demo)" },
          ],
        },
      },
      clients: linkAnanya,
      assignments: { createMany: { data: [{ userId: kavya.id, role: "LEAD" }, { userId: arjun.id, role: "ASSOCIATE" }] } },
      hearings: {
        createMany: {
          data: [
            { hearingDate: day(-44), purpose: "Admission", judge: "Hon'ble Justice (Demo) A. Rao", business: "Heard. Notice before admission. Interim stay of sealing granted.", nextDate: day(-23) },
            { hearingDate: day(-23), purpose: "For counter", judge: "Hon'ble Justice (Demo) A. Rao", business: "Respondents seek time to file counter. Interim order extended.", nextDate: day(-9) },
            { hearingDate: day(-9), purpose: "For counter", judge: "Hon'ble Justice (Demo) A. Rao", business: "Counter filed by R1. Reply to be filed within two weeks.", nextDate: day(12) },
          ],
        },
      },
      updates: {
        createMany: {
          data: [
            { kind: "NOTE", title: "Case file opened", visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-64) },
            { kind: "FILING", title: "Writ petition filed", body: "Filed with the interim application for stay.", eventDate: day(-62), visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-62) },
            { kind: "ORDER", title: "Interim stay granted", body: "Sealing stayed until the next date. Notice issued to the respondents.", eventDate: day(-44), visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-44) },
            { kind: "NOTE", title: "Review R1's counter before drafting the reply", body: "Internal: check whether the show-cause notice was served at all — the counter is silent on it.", visibility: "INTERNAL", authorUserId: arjun.id, createdAt: day(-8) },
            { kind: "HEARING", title: "Next hearing listed", body: "Counter affidavit / hearing", eventDate: day(12), visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-9) },
          ],
        },
      },
    },
    select: { id: true, reference: true },
  });

  // --- Case 2: a consumer complaint ---------------------------------------------
  const consumer = await prisma.case.create({
    data: {
      reference: CASE_REFS[1],
      title: "[Demo] Ananya Rao v. Apex Buildcon Pvt. Ltd.",
      summary: "DEMO DATA — fictional. Consumer complaint over delayed handover of an apartment: refund of the amount paid with interest, and compensation for the delay.",
      practiceArea: "real-estate-infrastructure",
      status: "ACTIVE",
      stage: "EVIDENCE",
      courtLevel: "CONSUMER_COMMISSION",
      courtName: "District Consumer Disputes Redressal Commission-I, Hyderabad",
      state: "Telangana",
      district: "Hyderabad",
      caseTypeCode: "CC",
      caseTypeName: "Consumer Complaint",
      caseNumber: "312",
      caseYear: 2026,
      filingDate: day(-120),
      registrationDate: day(-112),
      actsAndSections: ["Section 35, Consumer Protection Act, 2019"],
      reliefSought: "Refund of ₹38,50,000 with interest at 12% p.a. and compensation for mental agony.",
      lastHearingDate: day(-15),
      nextHearingDate: day(6),
      nextHearingPurpose: "Complainant's evidence affidavit",
      courtStatus: "Pending",
      courtStage: "EVIDENCE",
      createdById: kavya.id,
      parties: {
        createMany: {
          data: [
            { role: "COMPLAINANT", position: 1, name: "Ananya Rao (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "OPPOSITE_PARTY", position: 1, name: "Apex Buildcon Pvt. Ltd., rep. by its Managing Director (Demo)", isClient: false },
          ],
        },
      },
      clients: linkAnanya,
      assignments: { create: { userId: kavya.id, role: "LEAD" } },
      hearings: {
        createMany: {
          data: [
            { hearingDate: day(-78), purpose: "Appearance", business: "Opposite party appeared through counsel. Time granted for written version.", nextDate: day(-45) },
            { hearingDate: day(-45), purpose: "Written version", business: "Written version filed.", nextDate: day(-15) },
            { hearingDate: day(-15), purpose: "Evidence", business: "Complainant to file evidence affidavit.", nextDate: day(6) },
          ],
        },
      },
      updates: {
        createMany: {
          data: [
            { kind: "STATUS_CHANGE", title: "Status changed to Active", body: "Engagement confirmed in writing.", visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-122) },
            { kind: "FILING", title: "Complaint filed", eventDate: day(-120), visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-120) },
            { kind: "HEARING", title: "Evidence stage", body: "Please send the payment receipts and the builder's emails by the end of the week.", eventDate: day(-15), visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-15) },
          ],
        },
      },
    },
    select: { id: true, reference: true },
  });

  // --- Case 3: a commercial suit, with the firm's own folders ----------------
  const suit = await prisma.case.create({
    data: {
      reference: CASE_REFS[2],
      title: "[Demo] Sunrise Textiles Pvt. Ltd. v. Coastal Freight Carriers",
      summary: "DEMO DATA — fictional. Commercial suit for recovery of ₹62,40,000 for goods lost in transit, with interest and costs.",
      practiceArea: "dispute-resolution",
      status: "ACTIVE",
      stage: "PLEADINGS",
      courtLevel: "COMMERCIAL_COURT",
      courtName: "Commercial Court, Hyderabad",
      state: "Telangana",
      district: "Hyderabad",
      caseTypeCode: "COS",
      caseTypeName: "Commercial Original Suit",
      caseNumber: "118",
      caseYear: 2026,
      filingDate: day(-95),
      registrationDate: day(-90),
      actsAndSections: ["Commercial Courts Act, 2015", "Carriage by Road Act, 2007"],
      reliefSought: "Decree for ₹62,40,000 with interest at 18% p.a. from the date of loss, and costs.",
      lastHearingDate: day(-20),
      nextHearingDate: day(3),
      nextHearingPurpose: "Written statement / case management hearing",
      courtStatus: "Pending",
      courtStage: "PLEADINGS",
      createdById: kavya.id,
      parties: {
        createMany: {
          data: [
            { role: "PLAINTIFF", position: 1, name: "Sunrise Textiles Pvt. Ltd., rep. by its Director (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "DEFENDANT", position: 1, name: "Coastal Freight Carriers, rep. by its Partner (Demo)", isClient: false, counsel: "M/s Demo & Associates" },
          ],
        },
      },
      clients: { create: { clientId: sunrise.id } },
      assignments: { createMany: { data: [{ userId: arjun.id, role: "LEAD" }, { userId: kavya.id, role: "ASSOCIATE" }] } },
      hearings: {
        createMany: {
          data: [
            { hearingDate: day(-60), purpose: "First hearing", judge: "Commercial Court Judge (Demo)", business: "Summons issued to the defendant.", nextDate: day(-20) },
            { hearingDate: day(-20), purpose: "Appearance", judge: "Commercial Court Judge (Demo)", business: "Defendant appeared. 30 days granted to file the written statement.", nextDate: day(3) },
          ],
        },
      },
      updates: {
        createMany: {
          data: [
            { kind: "FILING", title: "Plaint filed", body: "With the statement of truth and the list of documents.", eventDate: day(-95), visibility: "CLIENT", authorUserId: arjun.id, createdAt: day(-95) },
            { kind: "HEARING", title: "Defendant appeared", body: "Written statement due in 30 days.", eventDate: day(-20), visibility: "CLIENT", authorUserId: arjun.id, createdAt: day(-20) },
            { kind: "NOTE", title: "Settlement feeler from the defendant", body: "Internal: their counsel hinted at 60% in settlement. Discuss with the client before the next date.", visibility: "INTERNAL", authorUserId: arjun.id, createdAt: day(-5) },
          ],
        },
      },
    },
    select: { id: true, reference: true },
  });

  // --- Case 4: a labour dispute ------------------------------------------------
  const labour = await prisma.case.create({
    data: {
      reference: CASE_REFS[3],
      title: "[Demo] Priya Menon v. Horizon Tech Solutions Pvt. Ltd.",
      summary: "DEMO DATA — fictional. Industrial dispute over termination without notice or retrenchment compensation; reinstatement with back wages sought.",
      practiceArea: "labour-employment",
      status: "ACTIVE",
      stage: "ARGUMENTS",
      courtLevel: "TRIBUNAL",
      courtName: "Labour Court-I, Hyderabad",
      state: "Telangana",
      district: "Hyderabad",
      caseTypeCode: "ID",
      caseTypeName: "Industrial Dispute",
      caseNumber: "44",
      caseYear: 2025,
      filingDate: day(-300),
      registrationDate: day(-290),
      actsAndSections: ["Section 2A, Industrial Disputes Act, 1947", "Section 25F, Industrial Disputes Act, 1947"],
      reliefSought: "Reinstatement with continuity of service and full back wages.",
      lastHearingDate: day(-12),
      nextHearingDate: day(18),
      nextHearingPurpose: "Arguments",
      courtStatus: "Pending",
      courtStage: "ARGUMENTS",
      createdById: arjun.id,
      parties: {
        createMany: {
          data: [
            { role: "PETITIONER", position: 1, name: "Priya Menon (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "RESPONDENT", position: 1, name: "Horizon Tech Solutions Pvt. Ltd. (Demo)", isClient: false },
          ],
        },
      },
      clients: { create: { clientId: priya.id } },
      assignments: { create: { userId: arjun.id, role: "LEAD" } },
      hearings: {
        createMany: {
          data: [
            { hearingDate: day(-120), purpose: "Evidence", business: "Petitioner examined as WW1.", nextDate: day(-60) },
            { hearingDate: day(-60), purpose: "Evidence", business: "Management witness examined as MW1.", nextDate: day(-12) },
            { hearingDate: day(-12), purpose: "Arguments", business: "Petitioner's arguments heard in part.", nextDate: day(18) },
          ],
        },
      },
      updates: {
        createMany: {
          data: [
            { kind: "HEARING", title: "Arguments begun", body: "Our arguments are half done; the rest on the next date.", eventDate: day(-12), visibility: "CLIENT", authorUserId: arjun.id, createdAt: day(-12) },
          ],
        },
      },
    },
    select: { id: true, reference: true },
  });

  // --- Case 5: a tax appeal, decided ----------------------------------------------
  const tax = await prisma.case.create({
    data: {
      reference: CASE_REFS[4],
      title: "[Demo] Sunrise Textiles Pvt. Ltd. v. Assistant Commissioner (State Tax)",
      summary: "DEMO DATA — fictional. Appeal against the denial of input tax credit on inward supplies for 2022–23. Allowed.",
      practiceArea: "taxation",
      status: "DISPOSED",
      stage: "DISPOSED",
      courtLevel: "TRIBUNAL",
      courtName: "Appellate Authority (GST), Hyderabad",
      state: "Telangana",
      caseTypeCode: "APL",
      caseTypeName: "GST Appeal",
      caseNumber: "209",
      caseYear: 2025,
      filingDate: day(-240),
      registrationDate: day(-235),
      actsAndSections: ["Section 16, CGST Act, 2017", "Section 107, CGST Act, 2017"],
      reliefSought: "Setting aside the demand of ₹14,85,000 and restoring the input tax credit.",
      lastHearingDate: day(-40),
      disposalDate: day(-30),
      disposalNature: "Allowed",
      courtStatus: "Disposed",
      createdById: sneha.id,
      parties: {
        createMany: {
          data: [
            { role: "APPELLANT", position: 1, name: "Sunrise Textiles Pvt. Ltd. (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "RESPONDENT", position: 1, name: "Assistant Commissioner (State Tax), Demo Circle", isClient: false },
          ],
        },
      },
      clients: { create: { clientId: sunrise.id } },
      assignments: { create: { userId: sneha.id, role: "LEAD" } },
      hearings: {
        createMany: {
          data: [
            { hearingDate: day(-150), purpose: "Hearing", business: "Appellant's submissions heard.", nextDate: day(-40) },
            { hearingDate: day(-40), purpose: "Final hearing", business: "Heard. Orders reserved.", nextDate: day(-30) },
          ],
        },
      },
      updates: {
        createMany: {
          data: [
            { kind: "ORDER", title: "Appeal allowed", body: "The demand is set aside and the credit restored.", eventDate: day(-30), visibility: "CLIENT", authorUserId: sneha.id, createdAt: day(-30) },
            { kind: "STATUS_CHANGE", title: "Status changed to Disposed", visibility: "CLIENT", authorUserId: sneha.id, createdAt: day(-29) },
          ],
        },
      },
    },
    select: { id: true, reference: true },
  });

  // --- Case 6: advisory work, no court ------------------------------------------------
  const advisory = await prisma.case.create({
    data: {
      reference: CASE_REFS[5],
      title: "[Demo] Title verification — Plot 27, Kokapet",
      summary: "DEMO DATA — fictional. Title search and legal opinion before the client buys a residential plot: 30-year chain of title, encumbrances and approvals.",
      practiceArea: "real-estate-infrastructure",
      status: "ACTIVE",
      stage: "PRE_FILING",
      courtLevel: "NOT_IN_LITIGATION",
      state: "Telangana",
      district: "Ranga Reddy",
      createdById: kavya.id,
      clients: { create: { clientId: priya.id } },
      assignments: { createMany: { data: [{ userId: kavya.id, role: "LEAD" }, { userId: sneha.id, role: "SUPPORT" }] } },
      updates: {
        createMany: {
          data: [
            { kind: "NOTE", title: "Documents received from the seller", body: "Sale deeds from 1996 onwards, pattadar passbook and the layout approval.", visibility: "CLIENT", authorUserId: kavya.id, createdAt: day(-7) },
            { kind: "NOTE", title: "Encumbrance certificate applied for", visibility: "CLIENT", authorUserId: sneha.id, createdAt: day(-4) },
          ],
        },
      },
    },
    select: { id: true, reference: true },
  });

  // --- Documents: tags, folders and court orders ------------------------------------------
  const folder = (caseId: string, name: string, section: "INTERNAL" | "CLIENT" | "COURT") =>
    prisma.documentFolder.create({
      data: { caseId, name, section, visibility: section === "INTERNAL" ? "INTERNAL" : "CLIENT", createdById: kavya.id },
      select: { id: true },
    });
  const pleadings = await folder(suit.id, "Pleadings", "COURT");
  const research = await folder(suit.id, "Research", "INTERNAL");
  await folder(writ.id, "Correspondence", "CLIENT");

  const files: [{ id: string; reference: string }, DemoDoc][] = [
    [writ, { title: "Trade licence (copy)", category: "EVIDENCE", visibility: "CLIENT", file: "trade-licence.pdf", lines: ["Trade Licence No. TL/DEMO/2019/0042"], byClientId: ananya.id }],
    [writ, { title: "Writ petition as filed", category: "PETITION", visibility: "CLIENT", file: "writ-petition.pdf", lines: ["W.P. No. 4521 of 2026 (Demo)"], byUserId: kavya.id, inCourtFolder: true }],
    [writ, { title: "Interim order", category: "ORDER", visibility: "CLIENT", file: "interim-order.pdf", lines: ["Sealing of the premises is stayed until the next date."], fromCourt: true }],
    [writ, { title: "Research note — natural justice", category: "OTHER", visibility: "INTERNAL", file: "research-note.pdf", lines: ["INTERNAL", "Cancellation without a show-cause notice: authorities."], byUserId: arjun.id }],
    [consumer, { title: "Allotment letter", category: "AGREEMENT", visibility: "CLIENT", file: "allotment-letter.pdf", lines: ["Allotment of Flat 804, Tower B (Demo)"], byClientId: ananya.id }],
    [consumer, { title: "Payment receipts", category: "FINANCIAL", visibility: "CLIENT", file: "payment-receipts.pdf", lines: ["Receipts totalling Rs. 38,50,000 (Demo)"], byClientId: ananya.id }],
    [consumer, { title: "Consumer complaint as filed", category: "PETITION", visibility: "CLIENT", file: "consumer-complaint.pdf", lines: ["C.C. No. 312 of 2026 (Demo)"], byUserId: kavya.id, inCourtFolder: true }],
    [suit, { title: "Plaint as filed", category: "PETITION", visibility: "CLIENT", file: "plaint.pdf", lines: ["C.O.S. No. 118 of 2026 (Demo)"], byUserId: arjun.id, folderId: pleadings.id, inCourtFolder: true }],
    [suit, { title: "Invoices and lorry receipts", category: "EVIDENCE", visibility: "CLIENT", file: "invoices.pdf", lines: ["Invoices and LRs for the lost consignment (Demo)"], byClientId: sunrise.id }],
    [suit, { title: "Case law on carrier liability", category: "OTHER", visibility: "INTERNAL", file: "carrier-liability.pdf", lines: ["INTERNAL", "Liability of common carriers: notes."], byUserId: arjun.id, folderId: research.id }],
    [suit, { title: "Order dated summons", category: "ORDER", visibility: "CLIENT", file: "summons-order.pdf", lines: ["Summons issued to the defendant (Demo)."], fromCourt: true }],
    [labour, { title: "Termination letter", category: "EVIDENCE", visibility: "CLIENT", file: "termination-letter.pdf", lines: ["Termination letter (Demo)"], byClientId: priya.id }],
    [labour, { title: "Claim statement", category: "PLEADING", visibility: "CLIENT", file: "claim-statement.pdf", lines: ["I.D. No. 44 of 2025 (Demo)"], byUserId: arjun.id, inCourtFolder: true }],
    [tax, { title: "Order-in-appeal", category: "ORDER", visibility: "CLIENT", file: "order-in-appeal.pdf", lines: ["Appeal allowed. Demand set aside (Demo)."], fromCourt: true }],
    [tax, { title: "Appeal memorandum", category: "PETITION", visibility: "CLIENT", file: "appeal-memo.pdf", lines: ["GST Appeal No. 209 of 2025 (Demo)"], byUserId: sneha.id, inCourtFolder: true }],
    [advisory, { title: "Sale deeds (1996 onwards)", category: "AGREEMENT", visibility: "CLIENT", file: "sale-deeds.pdf", lines: ["Chain of sale deeds (Demo)"], byClientId: priya.id }],
    [advisory, { title: "Draft title opinion", category: "OTHER", visibility: "INTERNAL", file: "draft-opinion.pdf", lines: ["INTERNAL - DRAFT", "Title opinion, Plot 27 (Demo)"], byUserId: kavya.id }],
  ];
  const seqByCase = new Map<string, number>();
  const orderDocs = new Map<string, string>();
  for (const [caseRow, doc] of files) {
    const seq = (seqByCase.get(caseRow.id) ?? 0) + 1;
    seqByCase.set(caseRow.id, seq);
    const id = await addDocument(caseRow, seq, doc);
    if (doc.fromCourt) orderDocs.set(caseRow.id, id);
  }
  for (const [caseId, seq] of seqByCase) await prisma.case.update({ where: { id: caseId }, data: { documentSeq: seq } });

  // Court orders, each with its PDF — "Open PDF" works on the Court record tab.
  const orders: [string, Date, string, string][] = [
    [writ.id, day(-44), "Interim Order", "Sealing of the petitioner's premises stayed until the next date of hearing."],
    [suit.id, day(-60), "Order", "Summons issued to the defendant, returnable in 30 days."],
    [tax.id, day(-30), "Final Order", "Appeal allowed; the demand is set aside and the input tax credit restored."],
  ];
  for (const [caseId, orderDate, orderType, summary] of orders) {
    await prisma.courtOrder.create({ data: { caseId, orderDate, orderType, summary, fileName: `demo-${orderType.toLowerCase().replace(/\s+/g, "-")}.pdf`, documentId: orderDocs.get(caseId) ?? null } });
  }

  await addDocument(null, 0, { title: "[Demo] Vakalatnama template", category: "VAKALATNAMA", visibility: "INTERNAL", file: "vakalatnama-template.pdf", lines: ["VAKALATNAMA (template)"], byUserId: kavya.id });

  // --- Client queries ---------------------------------------------------------------
  const queries = [
    { reference: "QRY-DEMX01", clientId: ananya.id, caseId: consumer.id, subject: "[Demo] Do I need to attend the next hearing?", message: "The next date is for my evidence affidavit. Do I have to be present in person?", status: "ANSWERED" as const, reply: "Not in person on that date — we will file your affidavit. Please sign it at our office two days before.", by: kavya.id },
    { reference: "QRY-DEMX02", clientId: sunrise.id, caseId: suit.id, subject: "[Demo] Can we settle before the next date?", message: "The carrier's side called us about settling. Should we talk to them directly?", status: "OPEN" as const },
    { reference: "QRY-DEMX03", clientId: priya.id, caseId: labour.id, subject: "[Demo] When will the award come?", message: "How long after arguments does the Labour Court usually pass the award?", status: "ANSWERED" as const, reply: "Usually within one to three months after arguments close. We will tell you as soon as it is pronounced.", by: arjun.id },
    { reference: "QRY-DEMX04", clientId: priya.id, caseId: advisory.id, subject: "[Demo] Which documents do you still need?", message: "The seller asked what else to send for the title check.", status: "OPEN" as const },
  ];
  for (const q of queries) {
    await prisma.clientQuery.create({
      data: {
        reference: q.reference,
        clientId: q.clientId,
        caseId: q.caseId,
        subject: q.subject,
        message: q.message,
        status: q.status,
        reply: q.reply ?? null,
        answeredById: q.by ?? null,
        answeredAt: q.by ? new Date() : null,
      },
    });
  }

  // --- Website: enquiries, jobs and applications -------------------------------------------
  const consentAt = new Date();
  const enquiries = [
    { reference: "ENQ-DEMX01", name: "Suresh Babu (Demo)", email: demoEmail("suresh.babu"), phone: "+91 90000 20001", matterType: "Real Estate & Infrastructure", description: "My neighbour has built over the boundary of my plot in Manikonda. I have the registered sale deed and the survey sketch. What can I do?", status: "NEW" as const, createdAt: day(-1) },
    { reference: "ENQ-DEMX02", name: "Lakshmi Prasanna (Demo)", email: demoEmail("lakshmi.p"), phone: "+91 90000 20002", matterType: "Labour & Employment", description: "Our company of 80 employees wants to update its standing orders and POSH policy. We would like a review.", status: "ACKNOWLEDGED" as const, createdAt: day(-3) },
    { reference: "ENQ-DEMX03", name: "Venkat Rao (Demo)", email: demoEmail("venkat.rao"), phone: "+91 90000 20003", matterType: "Banking & Finance", description: "The bank has issued a notice under Section 13(2) of the SARFAESI Act for our factory. We need advice on the reply within 60 days.", status: "CONFLICT_CHECK" as const, createdAt: day(-5) },
    { reference: "ENQ-DEMX04", name: "Farah Khan (Demo)", email: demoEmail("farah.k"), phone: "+91 90000 20004", matterType: "Corporate Advisory", description: "We are two founders setting up a private limited company and need a shareholders' agreement.", status: "ENGAGED" as const, createdAt: day(-9) },
  ];
  for (const e of enquiries) await prisma.enquiry.create({ data: { ...e, consent: true, consentAt } });

  const jobs = [
    { slug: "demo-associate-litigation", title: "[Demo] Associate — Litigation", practiceArea: "litigation", location: "Hyderabad", employmentType: "Full-time", experience: "2–4 years' post-qualification", status: "OPEN" as const, summary: "Join the litigation team on writ, civil and commercial matters before the High Court and the district courts. You will draft pleadings, brief counsel and appear on your own matters.", responsibilities: ["Draft petitions, counters and written arguments", "Appear before the High Court and district courts", "Keep clients informed on each hearing"], requirements: ["Enrolled with a State Bar Council", "2–4 years in litigation", "Fluent in English and Telugu"] },
    { slug: "demo-legal-intern", title: "[Demo] Legal Intern", practiceArea: null, location: "Hyderabad", employmentType: "Internship", experience: "Law students in their 3rd year (5-year course) or later", status: "OPEN" as const, summary: "A six-week internship across litigation and advisory work: research, drafting support and court visits.", responsibilities: ["Legal research and case notes", "Drafting support", "Court visits with the team"], requirements: ["Currently enrolled in an LL.B. programme", "Available full-time for six weeks"] },
    { slug: "demo-senior-associate-corporate", title: "[Demo] Senior Associate — Corporate", practiceArea: "corporate-ma", location: "Bengaluru", employmentType: "Full-time", experience: "5–8 years' post-qualification", status: "DRAFT" as const, summary: "Lead transactional work for mid-sized companies: investments, joint ventures and commercial contracts.", responsibilities: ["Run transactions end to end", "Supervise associates"], requirements: ["5–8 years in corporate practice"] },
    { slug: "demo-paralegal", title: "[Demo] Paralegal", practiceArea: null, location: "Guntur", employmentType: "Full-time", experience: "1–3 years", status: "CLOSED" as const, summary: "Support the Guntur office with filings, court records and client documents.", responsibilities: ["Filing and court records"], requirements: ["Graduate; familiarity with court procedure"] },
  ];
  for (const [index, job] of jobs.entries()) {
    await prisma.jobOpening.create({
      data: { ...job, sortOrder: 900 + index, publishedAt: job.status === "DRAFT" ? null : day(-20 + index), closesOn: job.status === "OPEN" ? day(30) : null },
    });
  }

  const applications = [
    { reference: "APP-DEMX01", name: "Rahul Sharma (Demo)", email: demoEmail("rahul.s"), phone: "+91 90000 30001", role: jobs[0]!.title, experience: "3 years", enrolment: "TS/3301/2022", message: "I have three years at a High Court practice in writs and service matters. CV sent by email quoting this reference.", status: "SHORTLISTED" as const, createdAt: day(-6) },
    { reference: "APP-DEMX02", name: "Meghana Kulkarni (Demo)", email: demoEmail("meghana.k"), phone: "+91 90000 30002", role: jobs[0]!.title, experience: "2 years", enrolment: "KAR/4410/2023", message: "Two years in civil litigation at the district courts; keen to move to the High Court.", status: "REVIEWING" as const, createdAt: day(-4) },
    { reference: "APP-DEMX03", name: "Aditya Narayan (Demo)", email: demoEmail("aditya.n"), phone: "+91 90000 30003", role: jobs[1]!.title, experience: "4th-year law student", enrolment: null, message: "Fourth-year B.A. LL.B. student looking for a winter internship in litigation.", status: "NEW" as const, createdAt: day(-2) },
    { reference: "APP-DEMX04", name: "Divya Teja (Demo)", email: demoEmail("divya.t"), phone: "+91 90000 30004", role: jobs[1]!.title, experience: "3rd-year law student", enrolment: null, message: "Third-year student with moot court experience; available from December.", status: "NEW" as const, createdAt: day(-1) },
  ];
  for (const a of applications) await prisma.careerApplication.create({ data: { ...a, consent: true, consentAt } });

  await linkTestAccess();
  // Built as a full set (the cases reference each other's people), then cut
  // down to the one case and shared with everyone.
  const trimmed = await trimSampleData();
  const shared = await shareCasesForTesting();

  logger.info({ trimmed, shared }, "Sample data added");
  return { added: true, message: "Sample case added and shared with everyone.", summary: { trimmed, shared } };
}

/**
 * At start-up, when SAMPLE_DATA=add is set: adds the sample set once, ever.
 * The audit log remembers that it ran, so removing the data later from the
 * console does not bring it back on the next restart.
 */
export async function seedSampleDataOnStartup(setting: string | undefined) {
  if (setting !== "add") return;
  try {
    const done = await prisma.auditLog.findFirst({ where: { action: "sample_data.seeded" }, select: { id: true } });
    if (done) return;
    const result = await addSampleData();
    await prisma.auditLog.create({ data: { action: "sample_data.seeded", entityType: "SampleData", metadata: result } });
  } catch (error) {
    logger.error({ err: error }, "Sample data could not be added");
  }
}

// ---------------------------------------------------------------------------
// One sample case, shared with everyone, for showing and testing the portals
// ---------------------------------------------------------------------------

/**
 * The sample case kept: a writ in the High Court with a file from each
 * source (the court's website, the client, the firm) and an internal note.
 */
const KEPT_CASE = CASE_REFS[0];
const KEPT_JOB = "demo-associate-litigation";
const notDemo = { OR: [{ email: null }, { NOT: { email: { endsWith: `@${DEMO_DOMAIN}` } } }] };

/**
 * Cuts the sample set down to the one case above, with its people, and one
 * job opening, application and enquiry, so every section still has an
 * example. The other sample cases go, with their files and queries, and so
 * do sample lawyers and clients who are not on the kept case.
 */
export async function trimSampleData() {
  const kept = await prisma.case.findFirst({ where: { reference: KEPT_CASE }, select: { id: true } });
  const dropped = (await prisma.case.findMany({ where: { reference: { in: CASE_REFS.filter((ref) => ref !== KEPT_CASE) } }, select: { id: true } })).map((c) => c.id);

  // The one sample query moves onto the kept case, for its client.
  if (kept) {
    const keptClient = await prisma.caseClient.findFirst({ where: { caseId: kept.id, client: { email: { endsWith: `@${DEMO_DOMAIN}` } } }, select: { clientId: true } });
    if (keptClient) await prisma.clientQuery.updateMany({ where: { reference: "QRY-DEMX01" }, data: { caseId: kept.id, clientId: keptClient.clientId } });
  }

  const versions = await prisma.documentVersion.findMany({ where: { document: { caseId: { in: dropped } } }, select: { storageKey: true } });
  await prisma.courtOrder.updateMany({ where: { caseId: { in: dropped } }, data: { documentId: null } });
  await prisma.document.deleteMany({ where: { caseId: { in: dropped } } });
  await prisma.clientQuery.deleteMany({
    where: { OR: [{ caseId: { in: dropped } }, { reference: { startsWith: "QRY-DEMX" }, NOT: { reference: "QRY-DEMX01" } }] },
  });
  await prisma.case.deleteMany({ where: { id: { in: dropped } } });

  const keptLawyers = kept ? (await prisma.caseAssignment.findMany({ where: { caseId: kept.id }, select: { userId: true } })).map((a) => a.userId) : [];
  const keptClients = kept ? (await prisma.caseClient.findMany({ where: { caseId: kept.id }, select: { clientId: true } })).map((c) => c.clientId) : [];
  const goneLawyers = (await prisma.user.findMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` }, id: { notIn: keptLawyers } }, select: { id: true } })).map((u) => u.id);
  await prisma.lawyerProfile.deleteMany({ where: { userId: { in: goneLawyers } } });
  const staff = await prisma.user.deleteMany({ where: { id: { in: goneLawyers } } });
  const clients = await prisma.client.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` }, id: { notIn: keptClients } } });
  const jobs = await prisma.jobOpening.deleteMany({ where: { slug: { startsWith: "demo-", not: KEPT_JOB } } });
  const applications = await prisma.careerApplication.deleteMany({ where: { reference: { startsWith: "APP-DEMX", not: "APP-DEMX01" } } });
  const enquiries = await prisma.enquiry.deleteMany({ where: { reference: { startsWith: "ENQ-DEMX", not: "ENQ-DEMX01" } } });
  for (const version of versions) await storage.delete(version.storageKey).catch(() => undefined);

  const summary = { cases: dropped.length, files: versions.length, staff: staff.count, clients: clients.count, jobs: jobs.count, applications: applications.count, enquiries: enquiries.count };
  logger.info(summary, "Sample data trimmed to one case");
  return summary;
}

/**
 * So everyone can try the portals: the sample case goes to every active
 * firm member (on it as a lawyer) and every active client account. Each
 * other case with no lawyer, or no client, gets one at random. Only adds;
 * nobody already on a case is taken off it.
 */
export async function shareCasesForTesting() {
  const staff = (await prisma.user.findMany({ where: { isActive: true, role: { in: ["OWNER", "ADMIN", "LAWYER"] }, ...notDemo }, select: { id: true } })).map((u) => u.id);
  const clients = (await prisma.client.findMany({ where: { isActive: true, ...notDemo }, select: { id: true } })).map((c) => c.id);
  const cases = await prisma.case.findMany({
    select: { id: true, reference: true, _count: { select: { assignments: true, clients: true } } },
  });
  const pick = (ids: string[]) => ids[Math.floor(Math.random() * ids.length)]!;

  let linked = 0;
  for (const c of cases) {
    const lawyers = c.reference === KEPT_CASE ? staff : c._count.assignments === 0 && staff.length ? [pick(staff)] : [];
    const people = c.reference === KEPT_CASE ? clients : c._count.clients === 0 && clients.length ? [pick(clients)] : [];
    const added = await prisma.caseAssignment.createMany({ data: lawyers.map((userId) => ({ caseId: c.id, userId, role: "ASSOCIATE" as const })), skipDuplicates: true });
    const addedClients = await prisma.caseClient.createMany({ data: people.map((clientId) => ({ caseId: c.id, clientId })), skipDuplicates: true });
    linked += added.count + addedClients.count;
  }
  logger.info({ cases: cases.length, staff: staff.length, clients: clients.length, linked }, "Cases shared for testing");
  return { cases: cases.length, staff: staff.length, clients: clients.length, linked };
}

/**
 * Once, at start-up: trims a full sample set already in the system and
 * shares what is left. Recorded in the audit log so it never runs again
 * (the console's Share button repeats the sharing on demand).
 */
export async function trimSampleDataOnStartup() {
  try {
    if (await prisma.auditLog.findFirst({ where: { action: "sample_data.trimmed" }, select: { id: true } })) return;
    if (!(await prisma.case.findFirst({ where: { reference: KEPT_CASE }, select: { id: true } }))) return;
    const trimmed = await trimSampleData();
    const shared = await shareCasesForTesting();
    await prisma.auditLog.create({ data: { action: "sample_data.trimmed", entityType: "SampleData", metadata: { trimmed, shared } } });
  } catch (error) {
    logger.error({ err: error }, "Sample data could not be trimmed");
  }
}

// ---------------------------------------------------------------------------
// The one case everyone tries the portals on
// ---------------------------------------------------------------------------

/** Prof. P.L. Vishweshwer Rao v. The State of Telangana, found by its title (spellings vary). */
const ONE_CASE_TITLE = { OR: [{ title: { contains: "vishweshw", mode: "insensitive" as const } }, { title: { contains: "vishwesw", mode: "insensitive" as const } }] };
const TEST_LAWYER_EMAILS = ["info@adooralegalservices.com", "pradeep.test@adoora.invalid", "anshu.test@adoora.invalid"];
const TEST_CLIENT = { email: "kiran.client@adoora.invalid", name: "Kiran Kumar (Demo client)" };

/** The case the temporary logins are put on: the Vishweshwer Rao case, or the sample case if it is not there. */
export async function findSharedCase(fallbackReference: string) {
  const matches = await prisma.case.findMany({ where: ONE_CASE_TITLE, select: { id: true }, take: 2 });
  if (matches.length === 1) return matches[0]!;
  return prisma.case.findUnique({ where: { reference: fallbackReference }, select: { id: true } });
}

/**
 * Once, at start-up: keeps only the Vishweshwer Rao case. Every other case
 * goes, with its files and queries. The test lawyers (Ganesh, Pradeep
 * Reddy, Anshu Sharma) and the demo client (Kiran Kumar) are put on
 * it. Nothing happens until exactly one case with that title exists, so it
 * waits for the case to be added and never guesses between two.
 */
export async function keepOnlyOneCaseOnStartup() {
  try {
    if (await prisma.auditLog.findFirst({ where: { action: "cases.kept_one" }, select: { id: true } })) return;
    const matches = await prisma.case.findMany({ where: ONE_CASE_TITLE, select: { id: true, reference: true, title: true } });
    if (matches.length !== 1) {
      logger.warn({ found: matches.length }, "Keep one case: need exactly one Vishweshwer Rao case; nothing changed");
      return;
    }
    const kept = matches[0]!;

    const dropped = (await prisma.case.findMany({ where: { id: { not: kept.id } }, select: { id: true } })).map((c) => c.id);
    const versions = await prisma.documentVersion.findMany({ where: { document: { caseId: { in: dropped } } }, select: { storageKey: true } });
    await prisma.courtOrder.updateMany({ where: { caseId: { in: dropped } }, data: { documentId: null } });
    await prisma.document.deleteMany({ where: { caseId: { in: dropped } } });
    await prisma.clientQuery.deleteMany({ where: { caseId: { in: dropped } } });
    await prisma.case.deleteMany({ where: { id: { in: dropped } } });
    for (const version of versions) await storage.delete(version.storageKey).catch(() => undefined);

    const lawyers = await prisma.user.findMany({ where: { email: { in: TEST_LAWYER_EMAILS } }, select: { id: true } });
    await prisma.caseAssignment.createMany({ data: lawyers.map((u) => ({ caseId: kept.id, userId: u.id, role: "ASSOCIATE" as const })), skipDuplicates: true });
    const client =
      (await prisma.client.findUnique({ where: { email: TEST_CLIENT.email }, select: { id: true } })) ??
      (await prisma.client.create({ data: { ...TEST_CLIENT, emailVerifiedAt: new Date() }, select: { id: true } }));
    await prisma.caseClient.createMany({ data: [{ caseId: kept.id, clientId: client.id }], skipDuplicates: true });

    const summary = { kept: kept.reference, title: kept.title, deletedCases: dropped.length, files: versions.length, lawyers: lawyers.length };
    await prisma.auditLog.create({ data: { action: "cases.kept_one", entityType: "Case", entityId: kept.id, metadata: summary } });
    logger.info(summary, "Kept only the Vishweshwer Rao case");
  } catch (error) {
    logger.error({ err: error }, "Keep one case failed");
  }
}

// ---------------------------------------------------------------------------
// Only the test people, with no personal emails or numbers
// ---------------------------------------------------------------------------

/** The firm accounts kept: Ganesh (the firm's main address), Pradeep Reddy and Anshu Sharma. */
const KEPT_STAFF = ["info@adooralegalservices.com", "pradeep.test@adoora.invalid", "anshu.test@adoora.invalid"];

/**
 * Once, at start-up: every other firm account and every client but the demo
 * client (Kiran Kumar) is deleted, with the website profiles of the deleted
 * firm accounts, so no personal email or number is left in the console.
 * Ganesh becomes the owner. Cases and files are kept.
 */
export async function keepOnlyTestPeopleOnStartup() {
  try {
    if (await prisma.auditLog.findFirst({ where: { action: "accounts.test_only" }, select: { id: true } })) return;

    const goneStaff = (
      await prisma.user.findMany({ where: { OR: [{ email: null }, { email: { notIn: KEPT_STAFF } }] }, select: { id: true } })
    ).map((u) => u.id);
    const profiles = await prisma.lawyerProfile.deleteMany({ where: { userId: { in: goneStaff } } });
    const staff = await prisma.user.deleteMany({ where: { id: { in: goneStaff } } });
    const clients = await prisma.client.deleteMany({ where: { OR: [{ email: null }, { email: { not: TEST_CLIENT.email } }] } });
    await prisma.user.updateMany({ where: { email: "info@adooralegalservices.com" }, data: { role: "OWNER" } });

    const summary = { staff: staff.count, profiles: profiles.count, clients: clients.count };
    await prisma.auditLog.create({ data: { action: "accounts.test_only", entityType: "User", metadata: summary } });
    logger.info(summary, "Kept only the test people");
  } catch (error) {
    logger.error({ err: error }, "Keeping only the test people failed");
  }
}
