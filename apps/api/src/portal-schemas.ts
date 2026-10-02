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
/** A case's three folders: Internal (firm only), Client, From court. */
export const documentSection = z.enum(["INTERNAL", "CLIENT", "COURT"]);
/** Who can see what is in a section: Internal is firm only, the others the client too. */
export const sectionVisibility = (section: z.infer<typeof documentSection>): "INTERNAL" | "CLIENT" => (section === "INTERNAL" ? "INTERNAL" : "CLIENT");
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
      .regex(/^[A-Z0-9]{16}$/, "A CNR number is 16 letters and digits, e.g. HBHC01… for the Telangana High Court.")
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
  title: z.string().trim().min(3, "Please give the case a title.").max(300),
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
  title: z.string().trim().min(3, "Please give the case a short title.").max(300),
  summary: z
    .string()
    .trim()
    .min(20, "Please describe the case in a sentence or two.")
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
  /** Which of the case's three folders. Clients' uploads always go to Client. */
  section: documentSection.default("CLIENT"),
  /** Every place it goes, comma separated ("INTERNAL,COURT/<folder id>"). */
  places: optionalText(2000),
  /** A folder of the case; the document takes the folder's section. */
  folderId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
});

export const documentPatchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: documentCategory.optional(),
  description: optionalText(2000),
  /** Move to the top of another of the three folders. */
  section: documentSection.optional(),
  /** Every place it should be in from now on (see lib/places.ts). */
  places: z.array(z.string().trim().max(100)).min(1, "Choose at least one folder.").max(30).optional(),
  /** Move into a folder (its section follows), or null for the top. */
  folderId: z.string().uuid().nullable().optional(),
});

export const folderSchema = z.object({
  name: z.string().trim().min(1, "Give the folder a name.").max(80),
  section: documentSection,
});

export const folderRenameSchema = z.object({
  name: z.string().trim().min(1, "Give the folder a name.").max(80),
});

export const documentListSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: documentCategory.optional(),
  case: z.string().trim().max(40).optional(),
  /** `1`: only the firm-wide "Internal" folder (documents on no case). */
  team: z.enum(["1"]).optional(),
  folder: z.enum(["client", "firm", "internal", "court"]).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Admin console ------------------------------------------------------------

const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254);
/** Optional email: left blank, the person signs in with their mobile number. */
const optionalEmail = z
  .union([z.literal(""), email])
  .optional()
  .transform((value) => value || undefined);
/** A mobile number, as typed; it must have at least ten digits. Required: it is how they sign in. */
const phone = z
  .string({ error: "Please enter a mobile number." })
  .trim()
  .max(32)
  .refine((value) => value.replace(/\D/g, "").length >= 10, "Please enter a mobile number with at least 10 digits.");

export const staffRole = z.enum(["OWNER", "ADMIN", "LAWYER", "EDITOR"]);

export const staffCreateSchema = z.object({
  email: optionalEmail,
  name: z.string().trim().min(2).max(120),
  role: staffRole,
  phone,
  barEnrolment: optionalText(80),
});

export const staffPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: staffRole.optional(),
  isActive: z.boolean().optional(),
  phone: phone.optional(),
  /** Only for an account with no email yet; a sign-in email is never changed. */
  email: optionalEmail,
  barEnrolment: optionalText(80),
});

export const clientCreateSchema = z.object({
  email: optionalEmail,
  name: z.string().trim().min(2).max(200),
  kind: z.enum(["INDIVIDUAL", "ORGANISATION"]).default("INDIVIDUAL"),
  organisation: optionalText(200),
  phone,
  address: optionalText(1000),
  /** Cases to give the new client access to. */
  caseIds: z.array(z.string().uuid()).max(50).optional(),
});

export const clientPatchSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  kind: z.enum(["INDIVIDUAL", "ORGANISATION"]).optional(),
  organisation: optionalText(200),
  phone: phone.optional(),
  /** Only for a client with no email yet; a sign-in email is never changed. */
  email: optionalEmail,
  address: optionalText(1000),
  isActive: z.boolean().optional(),
  /** When present, the complete set of cases the client can see. */
  caseIds: z.array(z.string().uuid()).max(50).optional(),
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

// Client queries -------------------------------------------------------------

export const queryStatus = z.enum(["OPEN", "ANSWERED", "CLOSED"]);

export const queryCreateSchema = z.object({
  subject: z.string().trim().min(3, "Please add a short subject.").max(200),
  message: z.string().trim().min(10, "Please describe your question in a sentence or two.").max(5000),
  caseReference: z.string().trim().max(40).optional().transform((value) => value || undefined),
});

export const queryPatchSchema = z.object({
  reply: optionalText(5000),
  status: queryStatus.optional(),
});

export const queryListSchema = z.object({
  status: queryStatus.optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
