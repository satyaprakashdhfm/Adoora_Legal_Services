import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { encryptDocument, sha256 } from "../lib/crypto.js";
import { storage } from "../storage/index.js";

/**
 * Demo data, so the console and the client dashboard can be seen with
 * something in them. Everything here is FICTIONAL: the parties, the case
 * numbers and the orders are invented, and every title starts "[Demo]".
 * No CNR is set, so nothing is ever looked up on eCourts (and billed).
 *
 *   node dist/scripts/demo-data.js <client-email>            add (idempotent)
 *   node dist/scripts/demo-data.js <client-email> --remove   take it all out
 *
 * On Railway: `railway ssh --service adoora-api -- node dist/scripts/demo-data.js you@example.com`.
 *
 * The demo cases are linked to the client account with that email (created
 * if it does not exist yet — it signs in with Google as usual). Removal
 * deletes only what this script created: the two demo cases with their
 * documents, timeline, hearings, orders and queries, and the demo template
 * in Team shared. The client account is left in place.
 */

const CASE_REFS = ["ALS-2026-DEMX01", "ALS-2026-DEMX02"];
const TEAM_DOC_REF = "ALS-TEAM-DEMX01";

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

async function remove() {
  const cases = await prisma.case.findMany({ where: { reference: { in: CASE_REFS } }, select: { id: true } });
  const caseIds = cases.map((c) => c.id);
  const versions = await prisma.documentVersion.findMany({
    where: { document: { OR: [{ caseId: { in: caseIds } }, { reference: TEAM_DOC_REF }] } },
    select: { storageKey: true },
  });
  await prisma.document.deleteMany({ where: { OR: [{ caseId: { in: caseIds } }, { reference: TEAM_DOC_REF }] } });
  await prisma.clientQuery.deleteMany({ where: { caseId: { in: caseIds } } });
  await prisma.case.deleteMany({ where: { id: { in: caseIds } } });
  for (const version of versions) await storage.delete(version.storageKey).catch(() => undefined);
  console.log(`Removed ${caseIds.length} demo case(s) and ${versions.length} stored file(s).`);
}

async function add(email: string) {
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new Error(`${email} is a staff account. Demo cases are linked to a client account; use a client's email.`);
  }
  if (await prisma.case.count({ where: { reference: { in: CASE_REFS } } })) {
    console.log("Demo data is already there. Run with --remove first to recreate it.");
    return;
  }

  const client =
    (await prisma.client.findUnique({ where: { email } })) ??
    (await prisma.client.create({ data: { email, name: "Greeshma Sappidi", kind: "INDIVIDUAL" } }));

  // Whoever is on the team: lawyers first, else the owners and admins.
  const staff = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["LAWYER", "ADMIN", "OWNER"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, role: true },
  });
  const lawyers = [...staff.filter((s) => s.role === "LAWYER"), ...staff.filter((s) => s.role !== "LAWYER")];
  const author = lawyers[0]?.id ?? null;
  const team = lawyers.slice(0, 2).map((l, i) => ({ userId: l.id, role: i === 0 ? ("LEAD" as const) : ("ASSOCIATE" as const) }));

  // --- Case 1: a writ petition in the High Court -------------------------
  const writ = await prisma.case.create({
    data: {
      reference: CASE_REFS[0]!,
      title: "[Demo] Sri Lakshmi Traders v. Greater City Development Authority",
      summary:
        "DEMO DATA — fictional. Writ petition challenging the cancellation of a trade licence without notice or hearing. Interim protection sought against sealing of the premises pending disposal.",
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
      createdById: author,
      parties: {
        createMany: {
          data: [
            { role: "PETITIONER", position: 1, name: "Sri Lakshmi Traders, rep. by its Proprietor (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "RESPONDENT", position: 1, name: "Greater City Development Authority, rep. by its Commissioner (Demo)", isClient: false, counsel: "Standing Counsel (Demo)" },
            { role: "RESPONDENT", position: 2, name: "State of Telangana, rep. by its Principal Secretary, MA&UD (Demo)", isClient: false, counsel: "Government Pleader (Demo)" },
          ],
        },
      },
      clients: { create: { clientId: client.id } },
      assignments: team.length ? { createMany: { data: team } } : undefined,
      hearings: {
        createMany: {
          data: [
            { hearingDate: day(-44), purpose: "Admission", judge: "Hon'ble Justice (Demo) A. Rao", business: "Heard. Notice before admission. Interim stay of sealing granted.", nextDate: day(-23) },
            { hearingDate: day(-23), purpose: "For counter", judge: "Hon'ble Justice (Demo) A. Rao", business: "Respondents seek time to file counter. Interim order extended.", nextDate: day(-9) },
            { hearingDate: day(-9), purpose: "For counter", judge: "Hon'ble Justice (Demo) A. Rao", business: "Counter filed by R1. Reply to be filed within two weeks.", nextDate: day(12) },
          ],
        },
      },
      orders: {
        createMany: {
          data: [
            { orderDate: day(-44), orderType: "Interim Order", fileName: "demo-interim-order.pdf", summary: "Sealing of the petitioner's premises stayed until the next date of hearing." },
          ],
        },
      },
      updates: {
        createMany: {
          data: [
            { kind: "NOTE", title: "Case file opened", visibility: "CLIENT", authorUserId: author, createdAt: day(-64) },
            { kind: "FILING", title: "Writ petition filed", body: "Filed with the interim application for stay.", eventDate: day(-62), visibility: "CLIENT", authorUserId: author, createdAt: day(-62) },
            { kind: "ORDER", title: "Interim stay granted", body: "Sealing stayed until the next date. Notice issued to the respondents.", eventDate: day(-44), visibility: "CLIENT", authorUserId: author, createdAt: day(-44) },
            { kind: "NOTE", title: "Review R1's counter before drafting the reply", body: "Internal: check whether the show-cause notice was served at all — the counter is silent on it.", visibility: "INTERNAL", authorUserId: author, createdAt: day(-8) },
            { kind: "HEARING", title: `Next hearing listed`, body: "Counter affidavit / hearing", eventDate: day(12), visibility: "CLIENT", authorUserId: author, createdAt: day(-9) },
          ],
        },
      },
    },
  });

  // --- Case 2: a consumer complaint ----------------------------------------
  const consumer = await prisma.case.create({
    data: {
      reference: CASE_REFS[1]!,
      title: "[Demo] Greeshma Sappidi v. Apex Buildcon Pvt. Ltd.",
      summary:
        "DEMO DATA — fictional. Consumer complaint over delayed handover of an apartment: refund of the amount paid with interest, and compensation for the delay.",
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
      createdByClientId: client.id,
      parties: {
        createMany: {
          data: [
            { role: "COMPLAINANT", position: 1, name: "Greeshma Sappidi (Demo)", isClient: true, counsel: "ADOORA Legal Services" },
            { role: "OPPOSITE_PARTY", position: 1, name: "Apex Buildcon Pvt. Ltd., rep. by its Managing Director (Demo)", isClient: false },
          ],
        },
      },
      clients: { create: { clientId: client.id } },
      assignments: team.length ? { createMany: { data: team.slice(0, 1) } } : undefined,
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
            { kind: "NOTE", title: "Matter opened from the client dashboard", visibility: "CLIENT", authorClientId: client.id, createdAt: day(-125) },
            { kind: "STATUS_CHANGE", title: "Status changed to Active", body: "Engagement confirmed in writing.", visibility: "CLIENT", authorUserId: author, createdAt: day(-122) },
            { kind: "FILING", title: "Complaint filed", eventDate: day(-120), visibility: "CLIENT", authorUserId: author, createdAt: day(-120) },
            { kind: "HEARING", title: "Evidence stage", body: "Please send the payment receipts and the builder's emails by the end of the week.", eventDate: day(-15), visibility: "CLIENT", authorUserId: author, createdAt: day(-15) },
          ],
        },
      },
    },
  });

  // --- Documents, one in each folder --------------------------------------
  const documents = [
    { case: writ, title: "Trade licence (copy)", category: "EVIDENCE", visibility: "CLIENT", byClient: true, file: "trade-licence.pdf", lines: ["DEMO DOCUMENT - FICTIONAL", "", "Trade Licence No. TL/DEMO/2019/0042", "Issued to: Sri Lakshmi Traders (Demo)"] },
    { case: writ, title: "Writ petition as filed", category: "PETITION", visibility: "CLIENT", byClient: false, file: "writ-petition.pdf", lines: ["DEMO DOCUMENT - FICTIONAL", "", "IN THE HIGH COURT FOR THE STATE OF TELANGANA", "W.P. No. 4521 of 2026 (Demo)", "Sri Lakshmi Traders v. Greater City Development Authority"] },
    { case: writ, title: "Interim order", category: "ORDER", visibility: "CLIENT", byClient: false, file: "interim-order.pdf", lines: ["DEMO DOCUMENT - FICTIONAL", "", "Sealing of the petitioner's premises is stayed", "until the next date of hearing."] },
    { case: writ, title: "Research note — natural justice", category: "OTHER", visibility: "INTERNAL", byClient: false, file: "research-note.pdf", lines: ["DEMO DOCUMENT - FICTIONAL - INTERNAL", "", "Cancellation without a show-cause notice:", "authorities on audi alteram partem."] },
    { case: consumer, title: "Allotment letter", category: "AGREEMENT", visibility: "CLIENT", byClient: true, file: "allotment-letter.pdf", lines: ["DEMO DOCUMENT - FICTIONAL", "", "Apex Buildcon Pvt. Ltd. (Demo)", "Allotment of Flat 804, Tower B"] },
    { case: consumer, title: "Payment receipts", category: "FINANCIAL", visibility: "CLIENT", byClient: true, file: "payment-receipts.pdf", lines: ["DEMO DOCUMENT - FICTIONAL", "", "Receipts totalling Rs. 38,50,000 (Demo)"] },
    { case: consumer, title: "Consumer complaint as filed", category: "PETITION", visibility: "CLIENT", byClient: false, file: "consumer-complaint.pdf", lines: ["DEMO DOCUMENT - FICTIONAL", "", "C.C. No. 312 of 2026 (Demo)"] },
  ] as const;

  let seqByCase = new Map<string, number>();
  for (const doc of documents) {
    const seq = (seqByCase.get(doc.case.id) ?? 0) + 1;
    seqByCase = seqByCase.set(doc.case.id, seq);
    const version = await storeVersion(`cases/${doc.case.id}`, doc.file, pdf([...doc.lines]));
    const who = doc.byClient ? { uploadedByClientId: client.id } : { uploadedByUserId: author };
    await prisma.document.create({
      data: {
        reference: `${doc.case.reference}-D${String(seq).padStart(3, "0")}`,
        caseId: doc.case.id,
        seq,
        title: doc.title,
        category: doc.category,
        visibility: doc.visibility,
        ...who,
        versions: { create: { ...version, ...who } },
      },
    });
  }
  for (const [caseId, seq] of seqByCase) await prisma.case.update({ where: { id: caseId }, data: { documentSeq: seq } });

  const template = await storeVersion("team", "vakalatnama-template.pdf", pdf(["DEMO DOCUMENT - FICTIONAL", "", "VAKALATNAMA (template)", "Before the Hon'ble ________________"]));
  await prisma.document.create({
    data: {
      reference: TEAM_DOC_REF,
      seq: 0,
      title: "[Demo] Vakalatnama template",
      category: "VAKALATNAMA",
      visibility: "INTERNAL",
      uploadedByUserId: author,
      versions: { create: { ...template, uploadedByUserId: author } },
    },
  });

  // --- A client query, answered ---------------------------------------------
  await prisma.clientQuery.create({
    data: {
      reference: "QRY-DEMX01",
      clientId: client.id,
      caseId: consumer.id,
      subject: "[Demo] Do I need to attend the next hearing?",
      message: "The next date is for my evidence affidavit. Do I have to be present in person?",
      status: author ? "ANSWERED" : "OPEN",
      reply: author ? "Not in person on that date — we will file your affidavit. Please sign it at our office two days before. (Demo reply)" : null,
      answeredById: author,
      answeredAt: author ? new Date() : null,
    },
  });

  console.log(`Added 2 demo cases (${CASE_REFS.join(", ")}) linked to ${email}, with 7 documents, a Team shared template and a client query.`);
  if (!author) console.log("No lawyer or admin accounts exist yet, so the demo cases have no lawyers assigned.");
}

const [email, flag] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error("Usage: node dist/scripts/demo-data.js <client-email> [--remove]");
  process.exit(1);
}

(flag === "--remove" ? remove() : add(email.toLowerCase()))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
