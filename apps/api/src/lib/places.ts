import { prisma } from "../db.js";
import { HttpError } from "./http.js";
import type { Principal } from "../auth/session.js";

/**
 * Where a document sits in its case. A case has three folders (Internal,
 * Client, From court) and the firm can make folders inside them; a document
 * can be in several of these places at once. Each place is written as the
 * section, or the section and a folder id: "COURT", "COURT/<folder id>".
 *
 * The first place is also kept in `section` and `folderId`. `visibility` is
 * INTERNAL only when every place is in Internal, so the access checks (which
 * read visibility) let a client see a file that is in any of their folders.
 */

export type Section = "INTERNAL" | "CLIENT" | "COURT";
const SECTIONS: readonly string[] = ["INTERNAL", "CLIENT", "COURT"];

export const placeKey = (section: Section, folderId?: string | null) => (folderId ? `${section}/${folderId}` : section);
export const sectionOfPlace = (place: string) => place.split("/")[0] as Section;

/** The columns to store for a set of places. */
export function placementFields(places: string[]) {
  const [section, folderId] = places[0]!.split("/") as [Section, string | undefined];
  return {
    places,
    section,
    folderId: folderId ?? null,
    visibility: places.every((place) => sectionOfPlace(place) === "INTERNAL") ? ("INTERNAL" as const) : ("CLIENT" as const),
  };
}

/** Checks requested places against the case's folders, without repeats. */
export async function checkPlaces(caseId: string, requested: string[]) {
  const places = [...new Set(requested.map((place) => place.trim()).filter(Boolean))];
  if (places.length === 0) throw new HttpError(400, "Choose at least one folder.", "no_folder");
  if (places.length > 30) throw new HttpError(400, "That is too many folders for one file.", "bad_folder");

  const folderIds = places.map((place) => place.split("/")[1]).filter((id): id is string => Boolean(id));
  const folders = folderIds.length
    ? await prisma.documentFolder.findMany({ where: { id: { in: folderIds }, caseId }, select: { id: true, section: true } })
    : [];
  for (const place of places) {
    const [section, folderId, extra] = place.split("/");
    const valid =
      extra === undefined && SECTIONS.includes(section!) && (!folderId || folders.some((f) => f.id === folderId && f.section === section));
    if (!valid) throw new HttpError(400, "One of those folders is not part of this case.", "bad_folder");
  }
  return places;
}

/**
 * What a viewer may know of where a file is. A client never learns that a
 * file is also kept in Internal, or in a folder the firm made there.
 */
export function placesForViewer<T extends { places: string[]; section: string; folderId: string | null }>(principal: Principal, doc: T): T {
  if (principal.kind === "staff") return doc;
  const places = doc.places.filter((place) => sectionOfPlace(place) !== "INTERNAL");
  const [section, folderId] = (places[0] ?? "CLIENT").split("/");
  return { ...doc, places, section: section!, folderId: folderId ?? null };
}
