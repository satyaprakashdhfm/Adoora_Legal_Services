import { prisma } from "./db.js";
import { HttpError } from "./lib/http.js";
import type { Principal } from "./auth/session.js";
import type { Prisma } from "../generated/prisma/client.js";

/**
 * Who may see and change which cases and documents. Every case and document
 * query in the API goes through these scopes, so the rules live in one place:
 *
 *   OWNER, ADMIN  every case, every document, internal items included
 *   LAWYER        cases they are assigned to, internal items included
 *   EDITOR        no case access (content only)
 *   Client        cases they are linked to; only items marked CLIENT
 *
 * A case outside the caller's scope is reported as not found, not as
 * forbidden, so references cannot be probed to learn which ones exist.
 */

export function isFirmAdmin(principal: Principal | undefined): boolean {
  return principal?.kind === "staff" && (principal.role === "OWNER" || principal.role === "ADMIN");
}

/** Staff who work on cases (everyone but EDITOR). */
export function isCaseStaff(principal: Principal | undefined): boolean {
  return principal?.kind === "staff" && principal.role !== "EDITOR";
}

/** A where-clause matching exactly the cases the caller may see. */
export function caseScope(principal: Principal): Prisma.CaseWhereInput {
  if (principal.kind === "client") {
    return { clients: { some: { clientId: principal.id } } };
  }

  switch (principal.role) {
    case "OWNER":
    case "ADMIN":
      return {};
    case "LAWYER":
      return { assignments: { some: { userId: principal.id } } };
    default:
      // Matches nothing.
      return { id: { in: [] } };
  }
}

/** Visibility filter for items within a visible case. */
export function visibilityScope(principal: Principal) {
  return principal.kind === "client" ? { visibility: "CLIENT" as const } : {};
}

export function documentScope(principal: Principal): Prisma.DocumentWhereInput {
  return {
    deletedAt: null,
    case: caseScope(principal),
    ...visibilityScope(principal),
  };
}

export function notFound(what = "case"): HttpError {
  return new HttpError(404, `No ${what} with that reference was found.`, "not_found");
}

/** Loads a case the caller may see, or throws 404. */
export async function findVisibleCase(principal: Principal, reference: string) {
  const found = await prisma.case.findFirst({
    where: { reference, ...caseScope(principal) },
  });
  if (!found) throw notFound();
  return found;
}

/**
 * Loads a case the caller may edit: admins, and lawyers assigned to it.
 * Clients never edit case records — they add notes and documents.
 */
export async function findEditableCase(principal: Principal, reference: string) {
  if (!isCaseStaff(principal)) throw notFound();
  return findVisibleCase(principal, reference);
}

/** Loads a document the caller may see, or throws 404. */
export async function findVisibleDocument(principal: Principal, reference: string) {
  const found = await prisma.document.findFirst({
    where: { reference, ...documentScope(principal) },
    include: { case: { select: { id: true, reference: true, title: true } } },
  });
  if (!found) throw notFound("document");
  return found;
}
