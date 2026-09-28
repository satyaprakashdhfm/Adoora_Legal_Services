import { createHash } from "node:crypto";
import type { Request } from "express";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { saveCourtDocument } from "../routes/documents.js";
import { applyCourtRecord } from "./court-record.js";
import { downloadPortalOrder, endPortalSession, type PortalResult } from "./court-portal.js";
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

/** How long after a lookup another is refused: nothing changes that fast in a court record. */
export const PORTAL_COOLDOWN_MS = 30 * 60 * 1000;

/** Enough for any case in one sitting; the rest come on the next lookup. */
const MAX_DOWNLOADS = 30;

const ymd = (value: Date) => value.toISOString().slice(0, 10);

export async function recentPortalLookup(caseId: string) {
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
  await prisma.courtSnapshot.create({
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
      const pdf = await downloadPortalOrder(result.session, order);
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
    changes: applied.changes,
  };
}
