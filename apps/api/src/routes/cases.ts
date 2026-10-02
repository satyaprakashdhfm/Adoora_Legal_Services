import { Router, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../db.js";
import { CNR_PATTERN, normaliseCnr } from "../integrations/ecourts.js";
import { attachCourtRecord, catchUpRefresh, draftFromRecord, ECOURTSINDIA_ONLY, lookupCnr, readCourtRecord, syncCase } from "../integrations/court-record.js";
import { newPortalCaptcha, startPortalLookup, submitPortalCaptcha, type Portal } from "../integrations/court-portal.js";
import { attachHeldLookup, holdLookup, PORTAL_COOLDOWN_MS, recentPortalLookup, rereadCase, storePortalResult } from "../integrations/court-documents.js";
import { env } from "../env.js";
import { HttpError } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { makeCaseReference } from "../lib/ids.js";
import { requireSignedIn } from "../middleware/auth.js";
import {
  caseScope,
  findEditableCase,
  findVisibleCase,
  isCaseStaff,
  isFirmAdmin,
  notFound,
  visibilityScope,
} from "../access.js";
import {
  assignmentsSchema,
  caseClientsSchema,
  caseCreateSchema,
  caseListSchema,
  caseUpdateEntrySchema,
  caseUpdateSchema,
  clientCaseSchema,
  folderRenameSchema,
  folderSchema,
  sectionVisibility,
} from "../portal-schemas.js";
import { uploadDocument, uploadMiddleware } from "./documents.js";
import { placementFields, placesForViewer } from "../lib/places.js";
import type { Principal } from "../auth/session.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Cases, for both dashboards. The same endpoints serve clients, lawyers and
 * admins; what each caller sees is decided by the scopes in access.ts, not
 * by which dashboard asked.
 */
export const casesRouter = Router();

casesRouter.use(requireSignedIn);

/** Editors work on content and have no business in case files. */
casesRouter.use((req, _res, next) => {
  const principal = req.principal!;
  next(principal.kind === "staff" && principal.role === "EDITOR" ? notFound() : undefined);
});

const STATUS_LABELS: Record<string, string> = {
  INTAKE: "Intake",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  DISPOSED: "Disposed",
  CLOSED: "Closed",
  WITHDRAWN: "Withdrawn",
};

function stageLabel(stage: string) {
  return stage.charAt(0) + stage.slice(1).toLowerCase().replace(/_/g, " ");
}

/**
 * Creating a case needs a unique reference. Collisions are vanishingly rare
 * at this volume, but a unique index turns one into an error, so retry.
 */
async function withFreshReference<T>(create: (reference: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await create(makeCaseReference());
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "P2002") throw error;
    }
  }
  throw new Error("Could not allocate a unique case reference.");
}

const summarySelect = {
  id: true,
  reference: true,
  title: true,
  status: true,
  stage: true,
  practiceArea: true,
  courtLevel: true,
  courtName: true,
  bench: true,
  caseTypeCode: true,
  caseNumber: true,
  caseYear: true,
  cnrNumber: true,
  nextHearingDate: true,
  nextHearingPurpose: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CaseSelect;

// ---------------------------------------------------------------------------
// List and create
// ---------------------------------------------------------------------------

/**
 * Cases are opened, linked and updated from the court by the firm. A client
 * reads their cases, uploads documents, adds notes and raises queries — the
 * rest answers 403, whatever the page shows.
 */
function firmOnly(principal: { kind: string }) {
  if (principal.kind === "client") {
    throw new HttpError(403, "The firm adds and updates cases. Please contact us to have a case linked to your account.", "firm_only");
  }
}

/** Opening a case (and the CNR lookup before it) is for owners and admins; they then assign lawyers. */
function adminsOpenCases(principal: Principal) {
  if (!isFirmAdmin(principal)) {
    throw new HttpError(403, principal.kind === "client"
      ? "The firm adds and updates cases. Please contact us to have a case linked to your account."
      : "Cases are opened by the firm's admins, who assign them to lawyers.", "admins_only");
  }
}

casesRouter.get("/", async (req, res) => {
  const principal = req.principal!;
  const query = caseListSchema.parse(req.query);
  const staff = principal.kind === "staff";

  const filters: Prisma.CaseWhereInput[] = [caseScope(principal)];
  if (query.status) filters.push({ status: query.status });
  if (query.courtLevel) filters.push({ courtLevel: query.courtLevel });
  if (query.q) {
    const q = query.q;
    filters.push({
      OR: [
        { reference: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { caseNumber: { contains: q, mode: "insensitive" } },
        { cnrNumber: { contains: q.replace(/[\s-]/g, ""), mode: "insensitive" } },
        { parties: { some: { name: { contains: q, mode: "insensitive" } } } },
        ...(staff ? [{ clients: { some: { client: { name: { contains: q, mode: "insensitive" as const } } } } }] : []),
      ],
    });
  }

  const cases = await prisma.case.findMany({
    where: { AND: filters },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select: {
      ...summarySelect,
      assignments: {
        select: { role: true, user: { select: { id: true, name: true } } },
        orderBy: { role: "asc" },
      },
      ...(staff
        ? { clients: { select: { client: { select: { id: true, name: true } } } } }
        : {}),
      _count: {
        select: {
          documents: { where: { deletedAt: null, ...visibilityScope(principal) } },
        },
      },
    },
  });

  const hasMore = cases.length > query.limit;
  const page = hasMore ? cases.slice(0, query.limit) : cases;

  res.json({
    data: page,
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  });
});

/**
 * One case per CNR. Staff are refused a second one outright. A client who is
 * already on the case is sent to it; a client adding a case the firm holds
 * for someone else gets an intake and the firm a note to link them instead —
 * a client is never told about a case they are not on.
 */
async function findDuplicate(cnr: string | null | undefined, exceptId?: string) {
  if (!cnr) return null;
  return prisma.case.findFirst({
    where: { cnrNumber: { equals: normaliseCnr(cnr), mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true, reference: true, clients: { select: { clientId: true } } },
  });
}

const duplicateError = (reference: string) =>
  new HttpError(409, `This case is already on file as ${reference}. Open it from Cases instead of adding it again.`, "duplicate_case");

/** The duplicate a principal may be told about, or null. */
async function visibleDuplicate(principal: Principal, cnr: string | null | undefined, exceptId?: string) {
  const found = await findDuplicate(cnr, exceptId);
  if (!found) return null;
  if (principal.kind === "client" && !found.clients.some((c) => c.clientId === principal.id)) return null;
  return found;
}

casesRouter.post("/", async (req, res) => {
  const principal = req.principal!;
  adminsOpenCases(principal);

  if (principal.kind === "client") {
    const input = clientCaseSchema.parse(req.body);
    const { parties, ...fields } = input;
    const own = await visibleDuplicate(principal, fields.cnrNumber);
    if (own) throw duplicateError(own.reference);
    // Held by the firm for someone else: an intake, flagged for the firm.
    const held = await findDuplicate(fields.cnrNumber);

    const created = await withFreshReference((reference) =>
      prisma.case.create({
        data: {
          ...fields,
          reference,
          status: "INTAKE",
          stage: "PRE_FILING",
          createdByClientId: principal.id,
          clients: { create: { clientId: principal.id } },
          parties: parties?.length ? { createMany: { data: parties } } : undefined,
          updates: {
            create: {
              kind: "NOTE",
              title: "Case added from the client dashboard",
              body: "The firm will review the details and confirm whether it can act. Until an engagement is confirmed in writing, no lawyer–client relationship exists.",
              visibility: "CLIENT",
              authorClientId: principal.id,
            },
          },
        },
        select: { id: true, reference: true },
      }),
    );

    if (held) {
      // Same court case as one on file: no second copy of its record or PDFs.
      await prisma.caseUpdate.create({
        data: {
          caseId: created.id,
          kind: "NOTE",
          title: `Same CNR as ${held.reference}`,
          body: `This is probably the case already on file as ${held.reference}. Add this client to ${held.reference} and close this intake, rather than keeping two copies.`,
          visibility: "INTERNAL",
          authorClientId: principal.id,
        },
      });
    } else if (!(await attachHeldLookup(req, { ...created, cnrNumber: fields.cnrNumber }))) {
      await attachCourtRecord(created.id, fields.cnrNumber, { clientId: principal.id });
    }
    await audit(req, "case.create", "Case", created.id, { reference: created.reference, by: "client" });
    res.status(201).json(created);
    return;
  }

  if (!isFirmAdmin(principal) && !(principal.kind === "staff" && principal.role === "LAWYER")) {
    throw notFound();
  }

  const input = caseCreateSchema.parse(req.body);
  const { parties, clientIds, assignments, ...fields } = input;
  const duplicate = await findDuplicate(fields.cnrNumber);
  if (duplicate) throw duplicateError(duplicate.reference);

  // Only admins decide who sees a case. A lawyer opening a matter is put on
  // it as lead, so it does not vanish from their own list.
  const admin = isFirmAdmin(principal);
  const team = admin
    ? assignments ?? []
    : [{ userId: principal.id, role: "LEAD" as const }];
  await assertAssignable(team.map((entry) => entry.userId));
  const clientList = admin ? clientIds ?? [] : [];
  await assertClientsExist(clientList);

  const created = await withFreshReference((reference) =>
    prisma.case.create({
      data: {
        ...fields,
        reference,
        createdById: principal.id,
        parties: parties?.length ? { createMany: { data: parties } } : undefined,
        clients: clientList.length
          ? { createMany: { data: clientList.map((clientId) => ({ clientId })) } }
          : undefined,
        assignments: team.length ? { createMany: { data: team } } : undefined,
        updates: {
          create: {
            kind: "NOTE",
            title: "Case file opened",
            visibility: "CLIENT",
            authorUserId: principal.id,
          },
        },
      },
      select: { id: true, reference: true },
    }),
  );

  if (!(await attachHeldLookup(req, { ...created, cnrNumber: fields.cnrNumber }))) {
    await attachCourtRecord(created.id, fields.cnrNumber, { userId: principal.id });
  }
  await audit(req, "case.create", "Case", created.id, { reference: created.reference });
  res.status(201).json(created);
});

async function assertAssignable(userIds: string[]) {
  if (!userIds.length) return;
  const found = await prisma.user.count({
    where: { id: { in: userIds }, isActive: true, role: { in: ["OWNER", "ADMIN", "LAWYER"] } },
  });
  if (found !== new Set(userIds).size) {
    throw new HttpError(400, "Cases can only be assigned to active lawyers and administrators.", "bad_assignment");
  }
}

async function assertClientsExist(clientIds: string[]) {
  if (!clientIds.length) return;
  const found = await prisma.client.count({ where: { id: { in: clientIds } } });
  if (found !== new Set(clientIds).size) {
    throw new HttpError(400, "One of the selected clients no longer exists.", "bad_client");
  }
}

// ---------------------------------------------------------------------------
// One case
// ---------------------------------------------------------------------------

function serialiseCase(
  principal: Principal,
  record: Awaited<ReturnType<typeof loadCaseDetail>>,
) {
  const staff = principal.kind === "staff";
  const { documentSeq: _seq, createdById: _a, createdByClientId: _b, snapshots, ...rest } = record;
  const latest = snapshots[0];

  return {
    ...rest,
    // The parts of the court's record with no column of their own (FIR,
    // category, tagged matters…), read from the latest stored response.
    courtFacts: latest ? readCourtRecord(latest.cnr, latest.payload).facts : [],
    documents: record.documents.map((doc) => placesForViewer(principal, doc)),
    // Clients see who is on their team, but not the other clients on a
    // shared matter or anything marked internal.
    clients: staff ? record.clients.map((entry) => entry.client) : undefined,
    assignments: record.assignments.map((entry) => {
      const { profile, ...user } = entry.user;
      const shown = profile?.published ? profile : null;
      const extra = {
        designation: shown?.designation ?? null,
        photoUrl:
          shown?.photoType && shown.photoUpdatedAt
            ? `/api/public/people/${shown.slug}/photo?v=${shown.photoUpdatedAt.getTime()}`
            : null,
        /** Portrait bundled with the website (public/), for carried-over profiles. */
        photo: shown?.photo ?? null,
      };
      return {
        role: entry.role,
        user: staff ? { ...user, ...extra } : { id: user.id, name: user.name, email: user.email, ...extra },
      };
    }),
    canEdit: isCaseStaff(principal),
    canManage: isFirmAdmin(principal),
    // What eCourtsIndia charges — for the firm's eyes only.
    ecourtsPricing: staff ? { details: env.ECOURTS_PRICE_DETAILS ?? null, refresh: env.ECOURTS_PRICE_REFRESH ?? null } : undefined,
    ecourtsBackup: staff && env.ECOURTS_BACKUP === "true",
    orders: record.orders.map(({ document, ...order }) => ({
      ...order,
      documentReference: document && !document.deletedAt ? document.reference : null,
    })),
  };
}

async function loadCaseDetail(principal: Principal, id: string) {
  return prisma.case.findUniqueOrThrow({
    where: { id },
    include: {
      parties: { orderBy: [{ role: "asc" }, { position: "asc" }] },
      clients: {
        select: {
          client: { select: { id: true, name: true, email: true, organisation: true, phone: true } },
        },
      },
      assignments: {
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              barEnrolment: true,
              // The lawyer's website profile, so the client sees the same
              // face and title the website shows.
              profile: { select: { slug: true, designation: true, photoType: true, photoUpdatedAt: true, photo: true, published: true } },
            },
          },
        },
        orderBy: { role: "asc" },
      },
      updates: {
        where: visibilityScope(principal),
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          authorUser: { select: { name: true } },
          authorClient: { select: { name: true } },
        },
      },
      documents: {
        where: { deletedAt: null, ...visibilityScope(principal) },
        orderBy: { seq: "desc" },
        include: {
          uploadedByUser: { select: { name: true } },
          uploadedByClient: { select: { name: true } },
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            select: { version: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
          },
        },
      },
      createdBy: { select: { name: true } },
      createdByClient: { select: { name: true } },
      hearings: {
        orderBy: { hearingDate: "desc" },
        take: 300,
        select: { id: true, hearingDate: true, purpose: true, judge: true, business: true, nextDate: true },
      },
      orders: {
        orderBy: { orderDate: "desc" },
        take: 300,
        select: {
          id: true,
          orderDate: true,
          orderType: true,
          fileName: true,
          summary: true,
          // The saved PDF, if it has been fetched from the court's website.
          document: { select: { reference: true, deletedAt: true } },
        },
      },
      snapshots: {
        where: ECOURTSINDIA_ONLY,
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { cnr: true, payload: true },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// eCourts: lookup by CNR, and syncing a case
// ---------------------------------------------------------------------------

/**
 * Each lookup is billed by eCourtsIndia, so it is limited per signed-in
 * account rather than per IP (staff can share an office connection).
 */
const ecourtsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `ecourts:${req.principal?.id ?? "anonymous"}`,
  message: {
    error: "rate_limited",
    message: "Too many eCourts lookups. Please wait a minute and try again.",
  },
});

/** Clients get a tighter hourly allowance on top: they check, they do not research. */
const clientEcourtsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.principal?.kind !== "client",
  keyGenerator: (req) => `ecourts-client:${req.principal?.id ?? "anonymous"}`,
  message: {
    error: "rate_limited",
    message: "You have checked eCourts several times this hour. Please try again later.",
  },
});

/**
 * eCourtsIndia is the paid backup to the court's website, for staff only,
 * and can be switched off (ECOURTS_BACKUP=false).
 */
const backupOnly: RequestHandler = (_req, _res, next) => {
  next(env.ECOURTS_BACKUP === "true" ? undefined : new HttpError(404, "The eCourtsIndia backup is switched off — use Update from court.", "backup_off"));
};

/**
 * GET /api/cases/:cnr — "fill from CNR" through eCourtsIndia (the backup). Fetches the court's record, keeps
 * the response (see court-record.ts), and returns it shaped for the case
 * form, so a new case can be reviewed and saved instead of typed in.
 *
 * Shares its path with the firm's own case records (`/api/cases/ALS-…`). The
 * two cannot collide: a CNR is 16 letters and digits with no hyphens, a firm
 * reference always has them. Anything that is not a CNR falls through to the
 * firm-record handler below.
 *
 * Open to clients as well as case staff. `existing` lists cases with this
 * CNR that the caller can already see; a client is never told about a firm
 * case they are not linked to.
 */
casesRouter.get(
  "/:cnr",
  (req, _res, next) => {
    const cnr = normaliseCnr(String(req.params.cnr));
    // Not a CNR (e.g. ALS-2026-K7Q3X9): let the next route handle it.
    if (!CNR_PATTERN.test(cnr)) return next("route");
    next();
  },
  (req, _res, next) => {
    next(isCaseStaff(req.principal) ? undefined : notFound());
  },
  backupOnly,
  ecourtsLimiter,
  clientEcourtsLimiter,
  async (req, res) => {
    const principal = req.principal!;
    const cnr = normaliseCnr(String(req.params.cnr));
    const [result, existing] = await Promise.all([
      lookupCnr(principal, cnr),
      prisma.case.findMany({
        where: { cnrNumber: cnr, ...caseScope(principal) },
        select: { reference: true, title: true, status: true },
        take: 5,
      }),
    ]);

    await audit(req, "ecourts.case_lookup", "EcourtsCase", cnr, { requestId: result.requestId });

    res.set("Cache-Control", "private, no-store");
    res.json({
      source: "ecourtsindia",
      cnr,
      requestId: result.requestId,
      fetchedAt: new Date().toISOString(),
      draft: draftFromRecord(cnr, result.record),
      existing,
      // The raw record is for the firm; a client gets the form draft only.
      data: principal.kind === "staff" ? result.data : undefined,
    });
  },
);

/**
 * POST /api/cases/:reference/court-sync — the eCourtsIndia backup ("Use
 * eCourtsIndia backup"), staff only; "Update from court" is the usual way. Anyone who
 * can see the case may ask; the result is written to the case for everyone.
 */
casesRouter.post("/:reference/court-sync", backupOnly, ecourtsLimiter, clientEcourtsLimiter, async (req, res) => {
  const principal = req.principal!;
  if (!isCaseStaff(principal)) throw notFound();
  const found = await findVisibleCase(principal, String(req.params.reference));
  if (!found.cnrNumber) {
    throw new HttpError(400, "Add the case's CNR number first — it is what eCourts looks the case up by.", "no_cnr");
  }

  const result = await syncCase(principal, found);
  await audit(req, "ecourts.case_sync", "Case", found.id, {
    reference: found.reference,
    requestId: result?.requestId ?? null,
    refreshed: result?.refreshed ?? false,
    changes: result?.changes ?? [],
  });

  const record = await loadCaseDetail(principal, found.id);
  res.json({
    case: serialiseCase(principal, record),
    changes: result?.changes ?? [],
    recordChanged: result?.recordChanged ?? false,
    refreshed: result?.refreshed ?? false,
    pending: result?.pending ?? false,
    sourceUpdatedAt: result?.sourceUpdatedAt ?? null,
  });
});

/**
 * POST /api/cases/:reference/court-rebuild — re-reads the stored eCourts
 * response without calling eCourts (no credit spent). Case staff only.
 */
casesRouter.post("/:reference/court-rebuild", async (req, res) => {
  const principal = req.principal!;
  const found = await findEditableCase(principal, String(req.params.reference));
  const result = await rereadCase(found.id, { userId: principal.id });
  if (!result) {
    throw new HttpError(400, "There is no saved court record for this case yet. Use Update from court first.", "no_snapshot");
  }
  await audit(req, "ecourts.case_rebuild", "Case", found.id, { reference: found.reference, hearings: result.hearings, orders: result.orders });

  const record = await loadCaseDetail(principal, found.id);
  res.json({
    case: serialiseCase(principal, record),
    changes: [`${result.hearings} hearings`, `${result.orders} orders`, ...result.changes.filter((c) => !/new order/.test(c))],
    recordChanged: false,
  });
});

// ---------------------------------------------------------------------------
// The court's own website: a person types the captcha, we fetch and save
// ---------------------------------------------------------------------------

/** A person types every captcha; this only stops a stuck page from hammering the court. */
const portalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `portal:${req.principal?.id ?? "anonymous"}`,
  message: { error: "rate_limited", message: "Too many court-website lookups this hour. Please try again later." },
});

const chosenPortal = (body: unknown): Portal | undefined => {
  const value = (body as { portal?: unknown } | undefined)?.portal;
  return value === "hc" || value === "district" ? value : undefined;
};

/** Sessions for a case not yet saved. */
const NEW_CASE = "new";

/**
 * POST /api/cases/cnr-lookup/start {cnr, portal?} — "New case from CNR" on
 * the court's own website: returns the captcha. Staff and clients.
 */
casesRouter.post("/cnr-lookup/start", portalLimiter, async (req, res) => {
  const principal = req.principal!;
  adminsOpenCases(principal);
  if (!isCaseStaff(principal) && principal.kind !== "client") throw notFound();
  const cnr = normaliseCnr(String(req.body?.cnr ?? ""));
  if (!CNR_PATTERN.test(cnr)) throw new HttpError(400, "A CNR is 16 letters and digits, e.g. TSHC010025912022.", "bad_cnr");
  // Before any captcha: staff learn of any case with this CNR, a client of their own.
  const duplicate = isCaseStaff(principal) ? await findDuplicate(cnr) : await visibleDuplicate(principal, cnr);
  if (duplicate) throw duplicateError(duplicate.reference);
  res.set("Cache-Control", "no-store");
  res.json({ cnr, ...(await startPortalLookup(cnr, NEW_CASE, principal.id, null, chosenPortal(req.body))) });
});

casesRouter.post("/cnr-lookup/captcha", portalLimiter, async (req, res) => {
  const principal = req.principal!;
  adminsOpenCases(principal);
  res.set("Cache-Control", "no-store");
  res.json(await newPortalCaptcha(String(req.body?.sessionId ?? ""), NEW_CASE, principal.id));
});

/**
 * POST /api/cases/cnr-lookup/submit {sessionId, code} — the typed captcha.
 * Returns the case shaped for the new-case form; the court's page is held
 * and written to the case (hearings, orders, PDFs) once it is saved.
 */
casesRouter.post("/cnr-lookup/submit", async (req, res) => {
  const principal = req.principal!;
  adminsOpenCases(principal);
  const code = String(req.body?.code ?? "");
  if (!code.trim()) throw new HttpError(400, "Please type the characters in the picture.", "portal_no_code");
  const result = await submitPortalCaptcha(String(req.body?.sessionId ?? ""), NEW_CASE, principal.id, code);
  if (!result.ok) {
    res.set("Cache-Control", "no-store");
    res.json({ retry: true, captcha: result.captcha });
    return;
  }
  const cnr = result.session.cnr;
  holdLookup(principal.id, cnr, result);
  const existing = await prisma.case.findMany({
    where: { cnrNumber: cnr, ...caseScope(principal) },
    select: { reference: true, title: true, status: true },
    take: 5,
  });
  await audit(req, "court_portal.case_lookup", "EcourtsCase", cnr, { portal: result.session.portal, orders: result.orders.length });
  res.set("Cache-Control", "private, no-store");
  res.json({
    source: "court-website",
    cnr,
    requestId: null,
    fetchedAt: new Date().toISOString(),
    // Orders sit apart from the case details on the court's page.
    draft: (() => {
      const draft = draftFromRecord(cnr, result.record);
      return { ...draft, court: { ...draft.court, orders: result.orders.length } };
    })(),
    existing,
  });
});

/**
 * POST /api/cases/:reference/portal/start — opens a session on the court's
 * website for the case's CNR and returns its captcha image. Staff and the
 * case's clients may use it; it is free.
 */
casesRouter.post("/:reference/portal/start", portalLimiter, async (req, res) => {
  const principal = req.principal!;
  firmOnly(principal);
  const found = await findVisibleCase(principal, String(req.params.reference));
  if (!found.cnrNumber) {
    throw new HttpError(400, "Add the case's CNR number first — it is what the court's website looks the case up by.", "no_cnr");
  }
  const recent = await recentPortalLookup(found.id);
  if (recent) {
    const minutes = Math.max(1, Math.round((Date.now() - recent.fetchedAt.getTime()) / 60000));
    const wait = Math.max(1, Math.round(PORTAL_COOLDOWN_MS / 60000) - minutes);
    throw new HttpError(
      429,
      `Updated from the court ${minutes} minute${minutes === 1 ? "" : "s"} ago and every PDF is saved. You can update again in ${wait} minute${wait === 1 ? "" : "s"}.`,
      "portal_recent",
    );
  }
  res.set("Cache-Control", "no-store");
  res.json(await startPortalLookup(found.cnrNumber, found.id, principal.id, found.courtName, chosenPortal(req.body)));
});

/** POST /api/cases/:reference/portal/captcha — a new image, when the first cannot be read. */
casesRouter.post("/:reference/portal/captcha", portalLimiter, async (req, res) => {
  const principal = req.principal!;
  firmOnly(principal);
  const found = await findVisibleCase(principal, String(req.params.reference));
  const sessionId = String(req.body?.sessionId ?? "");
  res.set("Cache-Control", "no-store");
  res.json(await newPortalCaptcha(sessionId, found.id, principal.id));
});

/**
 * POST /api/cases/:reference/portal/submit — the typed captcha. Fetches the
 * case page, stores the hearings, and saves each order's PDF to the case's
 * documents unless it is already there.
 */
casesRouter.post("/:reference/portal/submit", async (req, res) => {
  const principal = req.principal!;
  firmOnly(principal);
  const found = await findVisibleCase(principal, String(req.params.reference));
  if (!found.cnrNumber) throw new HttpError(400, "This case has no CNR.", "no_cnr");
  const sessionId = String(req.body?.sessionId ?? "");
  const code = String(req.body?.code ?? "");
  if (!code.trim()) throw new HttpError(400, "Please type the characters in the picture.", "portal_no_code");

  const result = await submitPortalCaptcha(sessionId, found.id, principal.id, code);
  if (!result.ok) {
    res.set("Cache-Control", "no-store");
    res.json({ retry: true, captcha: result.captcha });
    return;
  }

  const summary = await storePortalResult(req, { id: found.id, reference: found.reference, cnrNumber: found.cnrNumber }, result);
  await audit(req, "court_portal.lookup", "Case", found.id, { reference: found.reference, ...summary });
  const record = await loadCaseDetail(principal, found.id);
  res.json({ case: serialiseCase(principal, record), summary });
});

casesRouter.get("/:reference", async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleCase(principal, String(req.params.reference));
  const record = await loadCaseDetail(principal, found.id);
  catchUpRefresh(record);

  await audit(req, "case.view", "Case", found.id, { reference: found.reference });
  res.set("Cache-Control", "no-store");
  res.json(serialiseCase(principal, record));
});

casesRouter.patch("/:reference", async (req, res) => {
  const principal = req.principal!;
  const found = await findEditableCase(principal, String(req.params.reference));
  const input = caseUpdateSchema.parse(req.body);
  const { parties, ...fields } = input;
  if (fields.cnrNumber && fields.cnrNumber !== found.cnrNumber) {
    const duplicate = await findDuplicate(fields.cnrNumber, found.id);
    if (duplicate) throw duplicateError(duplicate.reference);
  }

  // Automatic timeline entries for the changes a client cares about.
  const timeline: Prisma.CaseUpdateCreateManyCaseInput[] = [];
  if (fields.status && fields.status !== found.status) {
    timeline.push({
      kind: "STATUS_CHANGE",
      title: `Status changed to ${STATUS_LABELS[fields.status]}`,
      visibility: "CLIENT",
      authorUserId: principal.id,
    });
  }
  if (fields.stage && fields.stage !== found.stage) {
    timeline.push({
      kind: "STATUS_CHANGE",
      title: `Stage: ${stageLabel(fields.stage)}`,
      visibility: "CLIENT",
      authorUserId: principal.id,
    });
  }
  if (
    fields.nextHearingDate &&
    fields.nextHearingDate.getTime() !== found.nextHearingDate?.getTime()
  ) {
    const date = fields.nextHearingDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    timeline.push({
      kind: "HEARING",
      title: `Next hearing listed for ${date}`,
      body: fields.nextHearingPurpose ?? found.nextHearingPurpose ?? null,
      eventDate: fields.nextHearingDate,
      visibility: "CLIENT",
      authorUserId: principal.id,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.case.update({
      where: { id: found.id },
      data: {
        ...fields,
        updates: timeline.length ? { createMany: { data: timeline } } : undefined,
      },
    });

    if (parties) {
      await tx.caseParty.deleteMany({ where: { caseId: found.id } });
      if (parties.length) {
        await tx.caseParty.createMany({
          data: parties.map((party) => ({ ...party, caseId: found.id })),
        });
      }
    }
  });

  await audit(req, "case.update", "Case", found.id, {
    reference: found.reference,
    fields: Object.keys(req.body ?? {}),
  });

  const record = await loadCaseDetail(principal, found.id);
  res.json(serialiseCase(principal, record));
});

/** Timeline entries. Clients may add notes; staff may log hearings and orders. */
casesRouter.post("/:reference/updates", async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleCase(principal, String(req.params.reference));
  const input = caseUpdateEntrySchema.parse(req.body);

  const client = principal.kind === "client";
  const created = await prisma.caseUpdate.create({
    data: {
      caseId: found.id,
      kind: client ? "NOTE" : input.kind,
      title: input.title,
      body: input.body ?? null,
      eventDate: input.eventDate ?? null,
      visibility: client ? "CLIENT" : input.visibility,
      authorUserId: client ? null : principal.id,
      authorClientId: client ? principal.id : null,
    },
  });

  // Touch the case so it rises to the top of both dashboards' lists.
  await prisma.case.update({ where: { id: found.id }, data: { updatedAt: new Date() } });
  await audit(req, "case.update_added", "Case", found.id, { updateId: created.id, visibility: created.visibility });
  res.status(201).json(created);
});

casesRouter.put("/:reference/assignments", async (req, res) => {
  const principal = req.principal!;
  if (!isFirmAdmin(principal)) throw notFound();
  const found = await findVisibleCase(principal, String(req.params.reference));
  const { assignments } = assignmentsSchema.parse(req.body);
  await assertAssignable(assignments.map((entry) => entry.userId));

  await prisma.$transaction([
    prisma.caseAssignment.deleteMany({ where: { caseId: found.id } }),
    prisma.caseAssignment.createMany({
      data: assignments.map((entry) => ({ ...entry, caseId: found.id })),
    }),
  ]);

  await audit(req, "case.assignments_set", "Case", found.id, { assignments });
  res.json({ ok: true });
});

casesRouter.put("/:reference/clients", async (req, res) => {
  const principal = req.principal!;
  if (!isFirmAdmin(principal)) throw notFound();
  const found = await findVisibleCase(principal, String(req.params.reference));
  const { clientIds } = caseClientsSchema.parse(req.body);
  await assertClientsExist(clientIds);

  await prisma.$transaction([
    prisma.caseClient.deleteMany({ where: { caseId: found.id } }),
    prisma.caseClient.createMany({
      data: [...new Set(clientIds)].map((clientId) => ({ clientId, caseId: found.id })),
    }),
  ]);

  await audit(req, "case.clients_set", "Case", found.id, { clientIds });
  res.json({ ok: true });
});

/** Upload a new document to a case. */
casesRouter.post("/:reference/documents", uploadMiddleware, async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleCase(principal, String(req.params.reference));
  const document = await uploadDocument(req, principal, found);
  res.status(201).json(document);
});

// ---------------------------------------------------------------------------
// Folders the firm makes inside a case's Internal, Client and From court
// ---------------------------------------------------------------------------

/** GET /api/cases/:reference/folders — clients get those outside Internal. */
casesRouter.get("/:reference/folders", async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleCase(principal, String(req.params.reference));
  const folders = await prisma.documentFolder.findMany({
    where: { caseId: found.id, ...(isCaseStaff(principal) ? {} : { visibility: "CLIENT" as const }) },
    orderBy: { name: "asc" },
    select: { id: true, name: true, visibility: true, section: true, createdAt: true },
  });
  res.set("Cache-Control", "no-store");
  res.json({ data: folders });
});

const folderTaken = (error: unknown) =>
  (error as { code?: string }).code === "P2002" ? new HttpError(409, "There is already a folder with that name here.", "folder_exists") : error;

/** POST /api/cases/:reference/folders {name, section} — staff. */
casesRouter.post("/:reference/folders", async (req, res) => {
  const principal = req.principal!;
  const found = await findEditableCase(principal, String(req.params.reference));
  const input = folderSchema.parse(req.body);
  const folder = await prisma.documentFolder
    .create({
      data: { caseId: found.id, name: input.name, section: input.section, visibility: sectionVisibility(input.section), createdById: principal.id },
      select: { id: true, name: true, visibility: true, section: true, createdAt: true },
    })
    .catch((error: unknown) => {
      throw folderTaken(error);
    });
  await audit(req, "folder.create", "DocumentFolder", folder.id, { reference: found.reference, name: folder.name, section: folder.section });
  res.status(201).json(folder);
});

/** PATCH /api/cases/:reference/folders/:id {name} — staff. */
casesRouter.patch("/:reference/folders/:id", async (req, res) => {
  const principal = req.principal!;
  const found = await findEditableCase(principal, String(req.params.reference));
  const { name } = folderRenameSchema.parse(req.body);
  const existing = await prisma.documentFolder.findFirst({ where: { id: String(req.params.id), caseId: found.id }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Folder not found.", "not_found");
  const folder = await prisma.documentFolder
    .update({ where: { id: existing.id }, data: { name }, select: { id: true, name: true, visibility: true, section: true, createdAt: true } })
    .catch((error: unknown) => {
      throw folderTaken(error);
    });
  await audit(req, "folder.rename", "DocumentFolder", folder.id, { reference: found.reference, name });
  res.json(folder);
});

/** DELETE /api/cases/:reference/folders/:id — staff. Its files move to the top; none is deleted. */
casesRouter.delete("/:reference/folders/:id", async (req, res) => {
  const principal = req.principal!;
  const found = await findEditableCase(principal, String(req.params.reference));
  const existing = await prisma.documentFolder.findFirst({ where: { id: String(req.params.id), caseId: found.id }, select: { id: true, name: true, section: true } });
  if (!existing) throw new HttpError(404, "Folder not found.", "not_found");
  // Its files move up to the top of its section, wherever else they also are.
  const key = `${existing.section}/${existing.id}`;
  await prisma.$transaction(async (tx) => {
    const inside = await tx.document.findMany({ where: { caseId: found.id, places: { has: key } }, select: { id: true, places: true } });
    for (const doc of inside) {
      const places = [...new Set(doc.places.map((place) => (place === key ? existing.section : place)))];
      await tx.document.update({ where: { id: doc.id }, data: placementFields(places) });
    }
    await tx.documentFolder.delete({ where: { id: existing.id } });
  });
  await audit(req, "folder.delete", "DocumentFolder", existing.id, { reference: found.reference, name: existing.name });
  res.status(204).end();
});
