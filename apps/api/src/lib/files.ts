import path from "node:path";

/**
 * Upload allow-list. Legal work runs on PDFs, office documents and scans;
 * anything else — archives, executables, HTML — is refused, because an
 * uploaded file is later opened on a lawyer's machine.
 *
 * The extension, the declared type and the file's leading bytes all have to
 * agree. A renamed executable fails the byte check even with a .pdf name.
 */

type Rule = { mime: string; magic?: "pdf" | "png" | "jpeg" | "webp" | "zip" | "ole" | "tiff" | "text" };

const RULES: Record<string, Rule> = {
  ".pdf": { mime: "application/pdf", magic: "pdf" },
  ".doc": { mime: "application/msword", magic: "ole" },
  ".docx": { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: "zip" },
  ".xls": { mime: "application/vnd.ms-excel", magic: "ole" },
  ".xlsx": { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", magic: "zip" },
  ".ppt": { mime: "application/vnd.ms-powerpoint", magic: "ole" },
  ".pptx": { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", magic: "zip" },
  ".odt": { mime: "application/vnd.oasis.opendocument.text", magic: "zip" },
  ".ods": { mime: "application/vnd.oasis.opendocument.spreadsheet", magic: "zip" },
  ".rtf": { mime: "application/rtf", magic: "text" },
  ".txt": { mime: "text/plain", magic: "text" },
  ".csv": { mime: "text/csv", magic: "text" },
  ".jpg": { mime: "image/jpeg", magic: "jpeg" },
  ".jpeg": { mime: "image/jpeg", magic: "jpeg" },
  ".png": { mime: "image/png", magic: "png" },
  ".webp": { mime: "image/webp", magic: "webp" },
  ".tif": { mime: "image/tiff", magic: "tiff" },
  ".tiff": { mime: "image/tiff", magic: "tiff" },
};

export const ACCEPTED_EXTENSIONS = Object.keys(RULES);

function startsWith(buffer: Buffer, bytes: number[], offset = 0) {
  return bytes.every((byte, i) => buffer[offset + i] === byte);
}

function matchesMagic(buffer: Buffer, magic: NonNullable<Rule["magic"]>): boolean {
  switch (magic) {
    case "pdf":
      // %PDF, allowing a little leading junk as some scanners emit.
      return buffer.subarray(0, 1024).includes("%PDF");
    case "png":
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpeg":
      return startsWith(buffer, [0xff, 0xd8, 0xff]);
    case "webp":
      return startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8);
    case "tiff":
      return startsWith(buffer, [0x49, 0x49, 0x2a, 0x00]) || startsWith(buffer, [0x4d, 0x4d, 0x00, 0x2a]);
    case "zip":
      return startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]);
    case "ole":
      return startsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "text":
      // No NUL bytes in the first 8 KB — a cheap "is this really text" test.
      return !buffer.subarray(0, 8192).includes(0);
  }
}

export type FileCheck =
  | { ok: true; mimeType: string; filename: string }
  | { ok: false; reason: string };

export function checkUpload(originalName: string, buffer: Buffer): FileCheck {
  const filename = sanitiseFilename(originalName);
  const extension = path.extname(filename).toLowerCase();
  const rule = RULES[extension];

  if (!rule) {
    return {
      ok: false,
      reason: `Files of type "${extension || "unknown"}" cannot be uploaded. Accepted: PDF, Word, Excel, PowerPoint, OpenDocument, text, and JPEG/PNG/WebP/TIFF images.`,
    };
  }

  if (buffer.length === 0) return { ok: false, reason: "The file is empty." };

  if (rule.magic && !matchesMagic(buffer, rule.magic)) {
    return {
      ok: false,
      reason: `The file's contents do not match its "${extension}" extension.`,
    };
  }

  // The stored type comes from the allow-list, never from the browser.
  return { ok: true, mimeType: rule.mime, filename };
}

/**
 * Filenames are shown back to people and sent in Content-Disposition, so
 * strip path parts, control characters and anything a shell or header would
 * treat specially. Unicode letters (Devanagari, Telugu, ...) are kept.
 */
export function sanitiseFilename(name: string): string {
  const base = path.basename(name.replace(/\\/g, "/"));
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f"<>:|?*/\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(-180);
  return cleaned || "document";
}

/** Content-Disposition with an ASCII fallback plus the RFC 5987 UTF-8 name. */
export function contentDisposition(filename: string, inline: boolean): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

/** Types the browser may display inline; everything else is a download. */
export function isInlineSafe(mimeType: string): boolean {
  return mimeType === "application/pdf" || /^image\/(png|jpeg|webp)$/.test(mimeType);
}
