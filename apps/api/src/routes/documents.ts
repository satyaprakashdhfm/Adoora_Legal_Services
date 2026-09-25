import { randomUUID } from "node:crypto";
import { Router, type Request, type RequestHandler } from "express";
import multer from "multer";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { HttpError } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { decryptDocument, encryptDocument, sha256 } from "../lib/crypto.js";
import { checkUpload, contentDisposition, isInlineSafe } from "../lib/files.js";
import { makeDocumentReference } from "../lib/ids.js";
import { ObjectNotFoundError, storage, storageFor } from "../storage/index.js";
import { requireSignedIn } from "../middleware/auth.js";
import {
  documentScope,
  findVisibleDocument,
  isCaseStaff,
  isFirmAdmin,
  notFound,
} from "../access.js";
import {
  documentListSchema,
  documentPatchSchema,
  documentUploadSchema,
} from "../portal-schemas.js";
import type { Principal } from "../auth/session.js";
import type { Prisma } from "../../generated/prisma/client.js";

export const documentsRouter = Router();
documentsRouter.use(requireSignedIn);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
    fields: 10,
    fieldSize: 16 * 1024,
  },
});

/** Single `file` field, with multer's errors turned into readable ones. */
export const uploadMiddleware: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      next(
        error.code === "LIMIT_FILE_SIZE"
          ? new HttpError(413, `Files can be up to ${env.MAX_UPLOAD_MB} MB.`, "file_too_large")
          : new HttpError(400, "The upload could not be read. Please choose the file again.", "bad_upload"),
      );
      return;
    }
    next(error as Error | undefined);
  });
};

/**
 * Checks, encrypts and stores an uploaded file, and returns the pieces a
 * DocumentVersion row needs. The object is written before the row, so a
 * failed write leaves nothing pointing at a missing object; if the row then
 * fails, the caller removes the orphaned object.
 */
async function storeFile(req: Request, caseId: string) {
  const file = req.file;
  if (!file) throw new HttpError(400, "Please choose a file to upload.", "no_file");

  const checked = checkUpload(file.originalname, file.buffer);
  if (!checked.ok) throw new HttpError(415, checked.reason, "file_rejected");

  const encrypted = encryptDocument(file.buffer);
  const storageKey = `cases/${caseId}/${randomUUID()}`;
  await storage.put(storageKey, encrypted.ciphertext, "application/octet-stream");

  return {
    storageKey,
    storageDriver: storage.name,
    filename: checked.filename,
    mimeType: checked.mimeType,
    sizeBytes: file.size,
    sha256: sha256(file.buffer),
    encKeyId: encrypted.encKeyId,
    wrappedKey: encrypted.wrappedKey,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  };
}

async function discard(storageKey: string) {
  await storage.delete(storageKey).catch((error: unknown) => {
    logger.error({ err: error, storageKey }, "Could not remove orphaned upload");
  });
}

function uploader(principal: Principal) {
  return principal.kind === "staff"
    ? { uploadedByUserId: principal.id }
    : { uploadedByClientId: principal.id };
}

/** Creates document Dnnn on a case the caller has already been checked against. */
export async function uploadDocument(
  req: Request,
  principal: Principal,
  target: { id: string; reference: string },
) {
  const fields = documentUploadSchema.parse(req.body ?? {});
  const stored = await storeFile(req, target.id);

  // Clients' uploads are always visible to them; only staff can file internally.
  const visibility = principal.kind === "client" ? "CLIENT" : fields.visibility;
  const title = fields.title ?? stored.filename.replace(/\.[^.]+$/, "");

  try {
    const document = await prisma.$transaction(async (tx) => {
      // The increment locks the case row, so concurrent uploads get distinct numbers.
      const { documentSeq } = await tx.case.update({
        where: { id: target.id },
        data: { documentSeq: { increment: 1 } },
        select: { documentSeq: true },
      });

      const created = await tx.document.create({
        data: {
          reference: makeDocumentReference(target.reference, documentSeq),
          caseId: target.id,
          seq: documentSeq,
          title,
          category: fields.category,
          description: fields.description ?? null,
          visibility,
          ...uploader(principal),
          versions: { create: { version: 1, ...stored, ...uploader(principal) } },
        },
      });

      await tx.caseUpdate.create({
        data: {
          caseId: target.id,
          kind: "DOCUMENT",
          title: `Document added: ${title}`,
          body: created.reference,
          visibility,
          ...(principal.kind === "staff"
            ? { authorUserId: principal.id }
            : { authorClientId: principal.id }),
        },
      });

      return created;
    });

    await audit(req, "document.upload", "Document", document.id, {
      reference: document.reference,
      case: target.reference,
      sizeBytes: stored.sizeBytes,
      sha256: stored.sha256,
    });

    return document;
  } catch (error) {
    await discard(stored.storageKey);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Listing and metadata
// ---------------------------------------------------------------------------

documentsRouter.get("/", async (req, res) => {
  const principal = req.principal!;
  if (principal.kind === "staff" && principal.role === "EDITOR") throw notFound("document");
  const query = documentListSchema.parse(req.query);

  const filters: Prisma.DocumentWhereInput[] = [documentScope(principal)];
  if (query.category) filters.push({ category: query.category });
  if (query.case) filters.push({ case: { reference: query.case } });
  if (query.q) {
    filters.push({
      OR: [
        { reference: { contains: query.q, mode: "insensitive" } },
        { title: { contains: query.q, mode: "insensitive" } },
        { versions: { some: { filename: { contains: query.q, mode: "insensitive" } } } },
        { case: { title: { contains: query.q, mode: "insensitive" } } },
      ],
    });
  }

  const documents = await prisma.document.findMany({
    where: { AND: filters },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    include: {
      case: { select: { reference: true, title: true } },
      uploadedByUser: { select: { name: true } },
      uploadedByClient: { select: { name: true } },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { version: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true },
      },
    },
  });

  const hasMore = documents.length > query.limit;
  const page = hasMore ? documents.slice(0, query.limit) : documents;
  res.set("Cache-Control", "no-store");
  res.json({ data: page, nextCursor: hasMore ? page[page.length - 1]?.id : null });
});

documentsRouter.get("/:reference", async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleDocument(principal, String(req.params.reference));

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: found.id },
    orderBy: { version: "desc" },
    select: {
      version: true,
      filename: true,
      mimeType: true,
      sizeBytes: true,
      sha256: true,
      createdAt: true,
      uploadedByUser: { select: { name: true } },
      uploadedByClient: { select: { name: true } },
    },
  });

  res.set("Cache-Control", "no-store");
  res.json({
    ...found,
    versions,
    canEdit: isCaseStaff(principal),
    canDelete: isFirmAdmin(principal),
    canAddVersion:
      isCaseStaff(principal) ||
      (principal.kind === "client" && found.uploadedByClientId === principal.id),
  });
});

documentsRouter.patch("/:reference", async (req, res) => {
  const principal = req.principal!;
  if (!isCaseStaff(principal)) throw notFound("document");
  const found = await findVisibleDocument(principal, String(req.params.reference));
  const input = documentPatchSchema.parse(req.body);

  const updated = await prisma.document.update({ where: { id: found.id }, data: input });
  await audit(req, "document.update", "Document", found.id, { reference: found.reference, changes: Object.keys(input) });
  res.json(updated);
});

/** New version of an existing document. The earlier versions stay readable. */
documentsRouter.post("/:reference/versions", uploadMiddleware, async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleDocument(principal, String(req.params.reference));

  const allowed =
    isCaseStaff(principal) ||
    (principal.kind === "client" && found.uploadedByClientId === principal.id);
  if (!allowed) {
    throw new HttpError(403, "Only the firm, or whoever uploaded this document, can add a new version.", "forbidden");
  }

  const stored = await storeFile(req, found.caseId);

  try {
    const version = await prisma.$transaction(async (tx) => {
      const { currentVersion } = await tx.document.update({
        where: { id: found.id },
        data: { currentVersion: { increment: 1 } },
        select: { currentVersion: true },
      });

      await tx.documentVersion.create({
        data: { documentId: found.id, version: currentVersion, ...stored, ...uploader(principal) },
      });

      await tx.caseUpdate.create({
        data: {
          caseId: found.caseId,
          kind: "DOCUMENT",
          title: `New version (v${currentVersion}) of ${found.title}`,
          body: found.reference,
          visibility: found.visibility,
          ...(principal.kind === "staff"
            ? { authorUserId: principal.id }
            : { authorClientId: principal.id }),
        },
      });

      return currentVersion;
    });

    await audit(req, "document.version_added", "Document", found.id, {
      reference: found.reference,
      version,
      sha256: stored.sha256,
    });

    res.status(201).json({ reference: found.reference, version });
  } catch (error) {
    await discard(stored.storageKey);
    throw error;
  }
});

/**
 * Download. Access is checked, the read is written to the audit log, and
 * only then is the object fetched and decrypted — the bytes never exist in
 * the clear anywhere but this response.
 */
documentsRouter.get("/:reference/download", async (req, res) => {
  const principal = req.principal!;
  const found = await findVisibleDocument(principal, String(req.params.reference));

  const requested = Number(req.query.version);
  const versionNo = Number.isInteger(requested) && requested > 0 ? requested : found.currentVersion;

  const version = await prisma.documentVersion.findUnique({
    where: { documentId_version: { documentId: found.id, version: versionNo } },
  });
  if (!version) throw notFound("version of this document");

  await audit(req, "document.download", "Document", found.id, {
    reference: found.reference,
    version: versionNo,
  });

  let plaintext: Buffer;
  try {
    const ciphertext = await storageFor(version.storageDriver).get(version.storageKey);
    plaintext = decryptDocument(ciphertext, version);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      logger.error({ reference: found.reference, version: versionNo }, "Stored document object is missing");
      throw new HttpError(410, "This file is no longer available in storage. Please contact the firm.", "object_missing");
    }
    throw error;
  }

  const inline = req.query.inline === "1" && isInlineSafe(version.mimeType);
  res.set({
    "Content-Type": inline ? version.mimeType : "application/octet-stream",
    "Content-Length": String(plaintext.length),
    "Content-Disposition": contentDisposition(version.filename, inline),
    "Cache-Control": "private, no-store",
    // A document opened inline must not be able to run script or be framed
    // elsewhere, even if a crafted PDF or image tries.
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(plaintext);
});

/** Soft delete — admins only. The stored versions are kept for the record. */
documentsRouter.delete("/:reference", async (req, res) => {
  const principal = req.principal!;
  if (!isFirmAdmin(principal)) throw notFound("document");
  const found = await findVisibleDocument(principal, String(req.params.reference));

  await prisma.document.update({ where: { id: found.id }, data: { deletedAt: new Date() } });
  await audit(req, "document.delete", "Document", found.id, { reference: found.reference });
  res.json({ ok: true });
});
