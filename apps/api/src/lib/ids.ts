import { randomInt } from "node:crypto";

/**
 * Identifier patterns for cases and documents.
 *
 *   Case      ALS-2026-K7Q3X9          firm prefix, year opened, 6 random chars
 *   Document  ALS-2026-K7Q3X9-D004     case reference, then a per-case sequence
 *
 * The case part is random rather than sequential: a running number would tell
 * every client how many matters the firm opens a year. Crockford's base32
 * alphabet leaves out I, L, O and U, so a reference read aloud over the phone
 * or copied from a printout cannot be misread (0/O, 1/I/L) — 6 characters
 * gives about a billion combinations per year.
 *
 * Documents are numbered within their case instead, because within a case the
 * order is useful ("see D004") and reveals nothing beyond that case.
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const FIRM_PREFIX = "ALS";

function randomCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i++) code += CROCKFORD[randomInt(CROCKFORD.length)];
  return code;
}

export function makeCaseReference(date = new Date()): string {
  return `${FIRM_PREFIX}-${date.getFullYear()}-${randomCode(6)}`;
}

export function makeDocumentReference(caseReference: string, seq: number): string {
  return `${caseReference}-D${String(seq).padStart(3, "0")}`;
}

export const CASE_REFERENCE = /^ALS-\d{4}-[0-9A-HJKMNP-TV-Z]{6}$/;
export const DOCUMENT_REFERENCE = /^ALS-\d{4}-[0-9A-HJKMNP-TV-Z]{6}-D\d{3,}$/;
