import { z } from "zod";

/**
 * Validation for the dashboards: cases, documents, and the admin console.
 *
 * On updates, a field that is absent is left alone, and an empty string or
 * null clears it — which is what a form sending its whole state expects.
 */

const optionalText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      const trimmed = value?.trim() ?? "";
      return trimmed ? trimmed : null;
    })
    .pipe(z.string().max(max, `Please keep this under ${max} characters.`).nullable().optional());

/** `YYYY-MM-DD`, stored as a date without a time zone. */
const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      ctx.addIssue({ code: "custom", message: "Please enter a valid date." });
      return z.NEVER;
    }
    return new Date(`${value}T00:00:00.000Z`);
  });

const optionalYear = z
  .union([z.coerce.number().int().min(1900).max(2100), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" ? null : value));

export const caseStatus = z.enum(["INTAKE", "ACTIVE", "ON_HOLD", "DISPOSED", "CLOSED", "WITHDRAWN"]);
export const caseStage = z.enum([
  "PRE_FILING", "FILED", "UNDER_SCRUTINY", "DEFECTS_NOTIFIED", "REGISTERED", "ADMISSION",
  "NOTICE_ISSUED", "PLEADINGS", "EVIDENCE", "ARGUMENTS", "RESERVED_FOR_ORDERS", "DISPOSED",
]);
export const courtLevel = z.enum([
  "SUPREME_COURT", "HIGH_COURT", "DISTRICT_COURT", "SUBORDINATE_COURT", "FAMILY_COURT",
  "COMMERCIAL_COURT", "TRIBUNAL", "CONSUMER_COMMISSION", "ARBITRATION", "QUASI_JUDICIAL",
  "NOT_IN_LITIGATION", "OTHER",
]);
export const partyRole = z.enum([
  "PETITIONER", "RESPONDENT", "APPELLANT", "APPLICANT", "PLAINTIFF", "DEFENDANT",
  "COMPLAINANT", "ACCUSED", "OPPOSITE_PARTY", "INTERVENOR", "OTHER",
]);
export const documentCategory = z.enum([
  "PETITION", "PLEADING", "AFFIDAVIT", "VAKALATNAMA", "EVIDENCE", "ORDER", "JUDGMENT",
  "NOTICE", "CORRESPONDENCE", "AGREEMENT", "IDENTITY", "FINANCIAL", "OTHER",
]);
export const visibility = z.enum(["CLIENT", "INTERNAL"]);
export const updateKind = z.enum(["NOTE", "HEARING", "ORDER", "FILING"]);

export const partySchema = z.object({
  role: partyRole,
  position: z.coerce.number().int().min(1).max(999).default(1),
  name: z.string().trim().min(1, "Each party needs a name.").max(300),
  isClient: z.boolean().default(false),
  counsel: optionalText(200),
});

/** eCourts CNR: 16 characters, letters and digits. */
const cnr = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const cleaned = (value ?? "").replace(/[\s-]/g, "").toUpperCase();
    return cleaned || null;
  })
  .pipe(
    z
      .string()
      .regex(/^[A-Z0-9]{16}$/, "A CNR number is 16 letters and digits, e.g. TSHC010012342025.")
      .nullable()
      .optional(),
  );

/** Fields a lawyer or admin may set on a case. */
const caseFields = {
  summary: optionalText(5000),
  practiceArea: optionalText(120),
  status: caseStatus.optional(),
  stage: caseStage.optional(),

  courtLevel: courtLevel.optional(),
  courtName: optionalText(200),
  bench: optionalText(200),
  state: optionalText(100),
  district: optionalText(100),
  courtHall: optionalText(60),
  coram: optionalText(300),

  caseTypeCode: optionalText(40),
  caseTypeName: optionalText(120),
  caseNumber: optionalText(40),
  caseYear: optionalYear,
  filingNumber: optionalText(60),
  filingDate: optionalDate,
  registrationDate: optionalDate,
  cnrNumber: cnr,

  actsAndSections: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
  reliefSought: optionalText(5000),

  originCourt: optionalText(200),
  originCaseNumber: optionalText(80),
  impugnedOrderDate: optionalDate,

  lastHearingDate: optionalDate,
  nextHearingDate: optionalDate,
  nextHearingPurpose: optionalText(200),
  disposalDate: optionalDate,
  disposalNature: optionalText(200),

  parties: z.array(partySchema).max(60).optional(),
};

export const caseCreateSchema = z.object({
  title: z.string().trim().min(3, "Please give the matter a title.").max(300),
  ...caseFields,
  clientIds: z.array(z.string().uuid()).max(20).optional(),
  assignments: z
    .array(z.object({ userId: z.string().uuid(), role: z.enum(["LEAD", "ASSOCIATE", "SUPPORT"]) }))
    .max(20)
    .optional(),
});

export const caseUpdateSchema = z.object({
  title: z.string().trim().min(3).max(300).optional(),
  ...caseFields,
});

/**
 * What a client can tell the firm when opening a matter from the dashboard.
 * It lands as INTAKE; the firm confirms the details and takes it on.
 */
export const clientCaseSchema = z.object({
  title: z.string().trim().min(3, "Please give the matter a short title.").max(300),
  summary: z
    .string()
    .trim()
    .min(20, "Please describe the matter in a sentence or two.")
    .max(5000),
  practiceArea: optionalText(120),
  courtLevel: courtLevel.optional(),
  courtName: optionalText(200),
  bench: optionalText(200),
  state: optionalText(100),
  district: optionalText(100),
  caseTypeCode: optionalText(40),
  caseTypeName: optionalText(120),
  caseNumber: optionalText(40),
  caseYear: optionalYear,
  cnrNumber: cnr,
  nextHearingDate: optionalDate,
  parties: z.array(partySchema).max(20).optional(),
});

export const caseListSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: caseStatus.optional(),
  courtLevel: courtLevel.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const caseUpdateEntrySchema = z.object({
  kind: updateKind.default("NOTE"),
  title: z.string().trim().min(2, "Please add a short title.").max(200),
  body: optionalText(5000),
  eventDate: optionalDate,
  visibility: visibility.default("CLIENT"),
});

export const assignmentsSchema = z.object({
  assignments: z
    .array(z.object({ userId: z.string().uuid(), role: z.enum(["LEAD", "ASSOCIATE", "SUPPORT"]) }))
    .max(20),
});

export const caseClientsSchema = z.object({
  clientIds: z.array(z.string().uuid()).max(20),
});

/** Multipart text fields that accompany an upload. */
export const documentUploadSchema = z.object({
  title: optionalText(200),
  category: documentCategory.default("OTHER"),
  description: optionalText(2000),
  visibility: visibility.default("CLIENT"),
});

export const documentPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: documentCategory.optional(),
  description: optionalText(2000),
  visibility: visibility.optional(),
});

export const documentListSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: documentCategory.optional(),
  case: z.string().trim().max(40).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Admin console ------------------------------------------------------------

const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254);

export const staffRole = z.enum(["OWNER", "ADMIN", "LAWYER", "EDITOR"]);

export const staffCreateSchema = z.object({
  email,
  name: z.string().trim().min(2).max(120),
  role: staffRole,
  phone: optionalText(32),
  barEnrolment: optionalText(80),
});

export const staffPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: staffRole.optional(),
  isActive: z.boolean().optional(),
  phone: optionalText(32),
  barEnrolment: optionalText(80),
});

export const clientCreateSchema = z.object({
  email,
  name: z.string().trim().min(2).max(200),
  kind: z.enum(["INDIVIDUAL", "ORGANISATION"]).default("INDIVIDUAL"),
  organisation: optionalText(200),
  phone: optionalText(32),
  address: optionalText(1000),
});

export const clientPatchSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  kind: z.enum(["INDIVIDUAL", "ORGANISATION"]).optional(),
  organisation: optionalText(200),
  phone: optionalText(32),
  address: optionalText(1000),
  isActive: z.boolean().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: staffRole.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const auditQuerySchema = z.object({
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(80).optional(),
  action: z.string().trim().max(80).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const enquiryPatchSchema = z.object({
  status: z.enum(["NEW", "ACKNOWLEDGED", "CONFLICT_CHECK", "ENGAGED", "DECLINED", "CLOSED"]).optional(),
  assignedTo: optionalText(120),
  internalNote: optionalText(5000),
});

export const applicationPatchSchema = z.object({
  status: z.enum(["NEW", "REVIEWING", "SHORTLISTED", "REJECTED", "WITHDRAWN"]).optional(),
  internalNote: optionalText(5000),
});
