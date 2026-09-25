import type { Request } from "express";
import { prisma } from "../db.js";
import { logger } from "../logger.js";
import { clientIp } from "./http.js";
import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Appends to the audit log on behalf of whoever made the request.
 *
 * An audit write failing must not fail the action it records — the person
 * has already done the thing — but it must not vanish either, so it is
 * logged loudly.
 */
export async function audit(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata?: Prisma.InputJsonValue,
) {
  const principal = req.principal;

  try {
    await prisma.auditLog.create({
      data: {
        actorId: principal?.kind === "staff" ? principal.id : null,
        actorClientId: principal?.kind === "client" ? principal.id : null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata,
        ipAddress: clientIp(req),
      },
    });
  } catch (error) {
    logger.error({ err: error, action, entityType, entityId }, "Audit write failed");
  }
}
