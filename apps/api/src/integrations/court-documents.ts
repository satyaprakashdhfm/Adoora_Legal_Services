import { createHash } from "node:crypto";
import type { Request } from "express";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { saveCourtDocument } from "../routes/documents.js";
import { applyCourtRecord, ECOURTSINDIA_ONLY, rebuildFromSnapshot } from "./court-record.js";
import { downloadPortalOrder, endPortalSession, readCasePage, type Portal, type PortalResult } from "./court-portal.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * What happens after a successful lookup on the court's website:
 *
 *  1. the case page is kept as a snapshot (once per distinct page),
 *  2. the hearing history and status are written to the case, exactly as an
 *     eCourtsIndia record would be,
 *  3. each order's PDF is saved to the case's documents — unless the order
 *     already has one. An order with a saved PDF is never downloaded again.
 */

/** Marks court-website snapshots, so the eCourtsIndia reader never mistakes one for its own. */
export const PORTAL_REQUEST_ID = "portal";

/**
 * Our own pause between updates of one case (not the court's): nothing in a
 * court record changes that fast. Skipped while any order still lacks its PDF.
 */
export const PORTAL_COOLDOWN_MS = 10 * 60 * 1000;

/** Enough for any case in one sitting; the rest come on the next lookup. */
const MAX_DOWNLOADS = 30;

const ymd = (value: Date) => value.toISOString().slice(0, 10);

type PortalOk = Extract<PortalResult, { ok: true }>;

/**
 * "New case from CNR": the court's answer is held here until the case is
 * saved, then written to it like any other lookup (hearings, orders, PDFs).
 * Kept in memory — a restart in between only means pressing "Update from
 * court" once on the new case.
 */
const LOOKUP_KEEP_MS = 30 * 60 * 1000;
const heldLookups = new Map<string, { result: PortalOk; at: number }>();
const heldKey = (owner: string, cnr: string) => `${owner}|${cnr}`;

export function holdLookup(owner: string, cnr: string, result: PortalOk) {
  for (const [key, held] of heldLookups) if (Date.now() - held.at > LOOKUP_KEEP_MS) heldLookups.delete(key);
  heldLookups.set(heldKey(owner, cnr), { result, at: Date.now() });
}

/** Writes a held lookup onto a just-created case. False when there is none. */
export async function attachHeldLookup(req: Request, target: { id: string; reference: string; cnrNumber: string | null | undefined }) {
  if (!target.cnrNumber) return false;
  const key = heldKey(req.principal!.id, target.cnrNumber);
  const held = heldLookups.get(key);
  if (!held || Date.now() - held.at > LOOKUP_KEEP_MS) return false;
  heldLookups.delete(key);
  try {
    const summary = await storePortalResult(req, { id: target.id, reference: target.reference, cnrNumber: target.cnrNumber }, held.result);
    logger.info({ case: target.reference, ...summary }, "Court portal: lookup attached to the new case");
  } catch (error) {
    logger.warn({ err: error, case: target.reference }, "Court portal: could not attach the lookup to the new case");
  }
  return true;
}

/**
 * "Re-read saved record": the latest saved page, from either source, read
 * again with today's reader. A court-website page is applied like a fresh
 * lookup (hearings updated, nothing deleted), so saved PDFs stay linked.
 */
export async function rereadCase(caseId: string, author: { userId?: string | null; clientId?: string | null }) {
  const [portal, ecourts] = await Promise.all([
    prisma.courtSnapshot.findFirst({ where: { caseId, requestId: PORTAL_REQUEST_ID }, orderBy: { fetchedAt: "desc" }, select: { payload: true, fetchedAt: true } }),
    prisma.courtSnapshot.findFirst({ where: { caseId, ...ECOURTSINDIA_ONLY }, orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
  ]);
  if (portal && (!ecourts || portal.fetchedAt >= ecourts.fetchedAt)) {
    const payload = portal.payload as { html?: string; portal?: Portal };
    const record = readCasePage(String(payload.html ?? ""), payload.portal === "hc" ? "hc" : "district");
    const applied = await applyCourtRecord(caseId, record, author);
    return { ...applied, hearings: record.hearings.length, orders: await prisma.courtOrder.count({ where: { caseId } }) };
  }
  return rebuildFromSnapshot(caseId, author);
}

export async function recentPortalLookup(caseId: string) {
  // An order still without its PDF lifts the pause — unless the court itself
  // has not uploaded it, which the last update found (see storePortalResult).
  const last = await prisma.courtSnapshot.findFirst({
    where: { caseId, requestId: PORTAL_REQUEST_ID },
    orderBy: { fetchedAt: "desc" },
    select: { payload: true },
  });
  const failedLastTime = Number((last?.payload as { failed?: number } | null)?.failed ?? 0);
  const missing = await prisma.courtOrder.count({ where: { caseId, documentId: null } });
  if (failedLastTime > 0 || (missing > 0 && !last)) return null;
  return prisma.courtSnapshot.findFirst({
    where: { caseId, requestId: PORTAL_REQUEST_ID, fetchedAt: { gte: new Date(Date.now() - PORTAL_COOLDOWN_MS) } },
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
}

export async function storePortalResult(
  req: Request,
  target: { id: string; reference: string; cnrNumber: string },
  result: Extract<PortalResult, { ok: true }>,
) {
  const principal = req.principal!;
  const author = { userId: principal.kind === "staff" ? principal.id : null, clientId: principal.kind === "client" ? principal.id : null };

  const hash = createHash("sha256").update(result.html).digest("hex");
  const snapshot = await prisma.courtSnapshot.create({
    data: {
      cnr: target.cnrNumber,
      caseId: target.id,
      requestId: PORTAL_REQUEST_ID,
      contentHash: hash,
      payload: { source: "ecourts-portal", portal: result.session.portal, html: result.html } as Prisma.InputJsonValue,
      fetchedByUserId: author.userId,
      fetchedByClientId: author.clientId,
    },
  });

  const applied = await applyCourtRecord(target.id, result.record, author);

  // Orders: match what the case already knows (by the court's file name, or
  // by date for orders first learnt from eCourtsIndia), then fetch only the
  // ones without a PDF.
  const known = await prisma.courtOrder.findMany({
    where: { caseId: target.id },
    select: { id: true, orderDate: true, fileName: true, documentId: true },
  });
  const claimed = new Set<string>();
  let saved = 0;
  let alreadySaved = 0;
  let failed = 0;
  let remaining = 0;
  let notUploaded = 0;

  for (const order of result.orders) {
    let row =
      known.find((k) => k.fileName === order.fileKey) ??
      known.find((k) => !claimed.has(k.id) && ymd(k.orderDate) === ymd(order.orderDate) && !result.orders.some((o) => o.fileKey === k.fileName));
    if (row) claimed.add(row.id);
    if (row?.documentId) {
      alreadySaved++;
      continue;
    }
    if (saved + failed >= MAX_DOWNLOADS) {
      remaining++;
      continue;
    }
    if (!row) {
      row = await prisma.courtOrder.create({
        data: { caseId: target.id, orderDate: order.orderDate, orderType: order.final ? "Final order" : order.title, fileName: order.fileKey },
        select: { id: true, orderDate: true, fileName: true, documentId: true },
      });
      known.push(row);
      claimed.add(row.id);
    }

    try {
      // The court's server sometimes drops a connection mid-way; one more try after a pause.
      const pdf = await downloadPortalOrder(result.session, order).catch(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2_000));
        return downloadPortalOrder(result.session, order);
      });
      if (pdf === "not_uploaded") {
        notUploaded++;
        continue;
      }
      if (!pdf) {
        failed++;
        continue;
      }
      const label = order.final ? "Judgment / final order" : "Order";
      const documentId = await saveCourtDocument(req, target, {
        buffer: pdf,
        filename: `${label.split(" ")[0]}-${ymd(order.orderDate)}.pdf`,
        title: `${label} dated ${order.orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`,
        category: order.final ? "JUDGMENT" : "ORDER",
        description: `From the court's website (eCourts), CNR ${target.cnrNumber}.`,
      });
      await prisma.courtOrder.update({ where: { id: row.id }, data: { documentId } });
      saved++;
    } catch (error) {
      failed++;
      logger.warn({ err: error, case: target.reference }, "Court portal: an order PDF could not be saved");
    }
  }

  endPortalSession(result.session.id);
  // Remembered for the pause between updates (recentPortalLookup).
  await prisma.courtSnapshot.update({
    where: { id: snapshot.id },
    data: { payload: { source: "ecourts-portal", portal: result.session.portal, html: result.html, failed, notUploaded } as Prisma.InputJsonValue },
  });

  if (saved) {
    await prisma.caseUpdate.create({
      data: {
        caseId: target.id,
        kind: "DOCUMENT",
        title: `${saved} court document${saved === 1 ? "" : "s"} saved from the court's website`,
        body: "In Documents → From the court.",
        visibility: "CLIENT",
        authorUserId: author.userId,
        authorClientId: author.clientId,
      },
    });
  }

  return {
    hearings: result.record.hearings.length,
    orders: result.orders.length,
    saved,
    alreadySaved,
    failed,
    remaining,
    notUploaded,
    changes: applied.changes,
  };
}
