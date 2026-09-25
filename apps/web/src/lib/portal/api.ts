/**
 * Browser client for the dashboards.
 *
 * Always same-origin (`/api/...`): next.config.ts rewrites that path to the
 * API service, so the session cookie is first-party and rides along without
 * any CORS or third-party-cookie configuration.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public issues?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined;

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: Body; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = "GET", body, signal } = options;
  const isForm = body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      signal,
      credentials: "same-origin",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(0, "We could not reach the server. Please check your connection and try again.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string; message?: string; issues?: { field: string; message: string }[] })
    | null;

  if (!response.ok) {
    const first = payload?.issues?.[0];
    throw new ApiError(
      response.status,
      first ? `${first.message}` : payload?.message ?? "Something went wrong. Please try again.",
      payload?.error,
      payload?.issues,
    );
  }

  return payload as T;
}

/**
 * After the console saves website content, ask the website to drop its
 * cached copy so the change shows on the next visit. Best-effort: the pages
 * refresh within five minutes regardless.
 */
export async function refreshWebsite(tags: ("website-people" | "website-jobs")[]) {
  await fetch("/revalidate", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags }),
  }).catch(() => undefined);
}

/** Link target for a document download; the browser sends the cookie itself. */
export function downloadUrl(reference: string, options: { version?: number; inline?: boolean } = {}) {
  const params = new URLSearchParams();
  if (options.version) params.set("version", String(options.version));
  if (options.inline) params.set("inline", "1");
  const query = params.toString();
  return `/api/documents/${encodeURIComponent(reference)}/download${query ? `?${query}` : ""}`;
}

export function googleSignInUrl(next = "") {
  return `/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`;
}

// ---------------------------------------------------------------------------
// Shapes returned by the API
// ---------------------------------------------------------------------------

export type StaffRole = "OWNER" | "ADMIN" | "LAWYER" | "EDITOR";

export type SessionUser = {
  kind: "staff" | "client";
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: StaffRole | null;
};

export type CaseStatus = "INTAKE" | "ACTIVE" | "ON_HOLD" | "DISPOSED" | "CLOSED" | "WITHDRAWN";
export type Visibility = "CLIENT" | "INTERNAL";

export type CaseSummary = {
  id: string;
  reference: string;
  title: string;
  status: CaseStatus;
  stage: string;
  practiceArea: string | null;
  courtLevel: string;
  courtName: string | null;
  bench: string | null;
  caseTypeCode: string | null;
  caseNumber: string | null;
  caseYear: number | null;
  cnrNumber: string | null;
  nextHearingDate: string | null;
  nextHearingPurpose: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: { role: string; user: { id: string; name: string } }[];
  clients?: { client: { id: string; name: string } }[];
  _count: { documents: number };
};

export type Party = {
  id?: string;
  role: string;
  position: number;
  name: string;
  isClient: boolean;
  counsel: string | null;
};

export type VersionSummary = {
  version: number;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type DocumentRecord = {
  id: string;
  reference: string;
  title: string;
  category: string;
  description: string | null;
  visibility: Visibility;
  currentVersion: number;
  uploadedByClientId?: string | null;
  createdAt: string;
  updatedAt: string;
  uploadedByUser: { name: string } | null;
  uploadedByClient: { name: string } | null;
  versions: VersionSummary[];
  case?: { reference: string; title: string };
};

export type TimelineEntry = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  eventDate: string | null;
  visibility: Visibility;
  createdAt: string;
  authorUser: { name: string } | null;
  authorClient: { name: string } | null;
};

export type CaseDetail = Omit<CaseSummary, "assignments" | "clients" | "_count"> & {
  summary: string | null;
  state: string | null;
  district: string | null;
  courtHall: string | null;
  coram: string | null;
  caseTypeName: string | null;
  filingNumber: string | null;
  filingDate: string | null;
  registrationDate: string | null;
  actsAndSections: string[];
  reliefSought: string | null;
  originCourt: string | null;
  originCaseNumber: string | null;
  impugnedOrderDate: string | null;
  lastHearingDate: string | null;
  disposalDate: string | null;
  disposalNature: string | null;
  courtStatus: string | null;
  courtStage: string | null;
  courtCheckedAt: string | null;
  hearings: CourtHearing[];
  orders: CourtOrder[];
  parties: Party[];
  clients?: { id: string; name: string; email: string; organisation: string | null; phone: string | null }[];
  assignments: {
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
      role?: StaffRole;
      barEnrolment?: string | null;
      /** From the lawyer's website profile, when they have one. */
      designation?: string | null;
      photoUrl?: string | null;
      /** Portrait bundled with the website (`public/`, .jpg), for carried-over profiles. */
      photo?: string | null;
    };
  }[];
  updates: TimelineEntry[];
  documents: DocumentRecord[];
  createdBy: { name: string } | null;
  createdByClient: { name: string } | null;
  canEdit: boolean;
  canManage: boolean;
};

/** A row of the court's hearing history, from eCourts. */
export type CourtHearing = {
  id: string;
  hearingDate: string;
  purpose: string | null;
  judge: string | null;
  business: string | null;
  nextDate: string | null;
};

/** An order or judgment on the court's record, from eCourts. */
export type CourtOrder = {
  id: string;
  orderDate: string;
  orderType: string;
  fileName: string;
  summary: string | null;
};

/** `GET /api/cases/:cnr` — the court's record, shaped for the case form. */
export type CnrLookup = {
  cnr: string;
  fetchedAt: string;
  requestId: string | null;
  draft: Record<string, unknown> & {
    title: string;
    parties: Party[];
    actsAndSections: string[];
    court: { status: string | null; stage: string | null; hearings: number; orders: number };
  };
  existing: { reference: string; title: string; status: CaseStatus }[];
};

export type ClientQuery = {
  id: string;
  reference: string;
  subject: string;
  message: string;
  status: "OPEN" | "ANSWERED" | "CLOSED";
  reply: string | null;
  answeredAt: string | null;
  createdAt: string;
  case: { reference: string; title: string } | null;
  client: { id: string; name: string; email: string };
  answeredBy: { name: string } | null;
};

export type LawyerProfile = {
  id: string;
  slug: string;
  name: string;
  designation: string;
  group: "LEGAL" | "BUSINESS";
  qualification: string | null;
  office: string | null;
  enrolment: string | null;
  stateBar: string | null;
  enrolledSince: number | null;
  experience: string | null;
  practices: string[];
  education: string[];
  bio: string[];
  memberships: string[];
  email: string | null;
  summary: string | null;
  photo: string | null;
  photoUrl: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  userId: string | null;
  user?: { id: string; name: string; email: string; role: StaffRole } | null;
};

export type JobOpening = {
  id: string;
  slug: string;
  title: string;
  practiceArea: string | null;
  location: string | null;
  employmentType: string;
  experience: string | null;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  status: "DRAFT" | "OPEN" | "CLOSED";
  closesOn: string | null;
  publishedAt: string | null;
  sortOrder: number;
  applications?: number;
};

export type Page<T> = { data: T[]; nextCursor: string | null };
