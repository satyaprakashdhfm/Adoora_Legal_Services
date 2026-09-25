import { FIRST_SIDE, SECOND_SIDE, labelFor, PARTY_ROLES } from "@/lib/portal/legal";
import type { Party } from "@/lib/portal/api";

/** "WP No. 12345 of 2026" — the form Indian courts cite a case in. */
export function courtNumber(record: {
  caseTypeCode: string | null;
  caseNumber: string | null;
  caseYear: number | null;
}): string | null {
  if (!record.caseNumber) return null;
  const type = record.caseTypeCode ? `${record.caseTypeCode} ` : "";
  const year = record.caseYear ? ` of ${record.caseYear}` : "";
  return `${type}No. ${record.caseNumber}${year}`;
}

/** Dates arrive as ISO strings for @db.Date columns; show them as 14 Oct 2026. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** For `<input type="date">`. */
export function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Days from today to a date-only value; negative if past. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const today = new Date(new Date().toISOString().slice(0, 10)).getTime();
  return Math.round((new Date(value.slice(0, 10)).getTime() - today) / 86_400_000);
}

/** "Respondent No. 2" style label. */
export function partyLabel(party: Pick<Party, "role" | "position">, sameRoleCount: number) {
  const role = labelFor(PARTY_ROLES, party.role);
  return sameRoleCount > 1 ? `${role} No. ${party.position}` : role;
}

/** "Ravi Kumar v. State of Telangana & Ors." from the parties list. */
export function causeTitle(parties: Party[]): string | null {
  const first = parties.filter((p) => FIRST_SIDE.has(p.role)).sort((a, b) => a.position - b.position);
  const second = parties.filter((p) => SECOND_SIDE.has(p.role)).sort((a, b) => a.position - b.position);
  if (!first.length || !second.length) return null;
  const side = (list: Party[]) => `${list[0]!.name}${list.length > 1 ? " & Ors." : ""}`;
  return `${side(first)} v. ${side(second)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /^[\p{L}]/u.test(part) && !/^(adv|dr|mr|mrs|ms)\.?$/i.test(part))
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** "Adv. Lakshmi Rao" → "Lakshmi": the first word that is not an honorific. */
export function firstName(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.find((word) => !/^(adv|advocate|dr|mr|mrs|ms|shri|smt|sri)\.?$/i.test(word)) ?? words[0] ?? name;
}
