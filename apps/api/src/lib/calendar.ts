/**
 * An iCalendar (RFC 5545) file for one hearing, so "Add to calendar" opens
 * it in the user's own calendar app (Apple Calendar, Outlook, Google via
 * import, most phones).
 *
 * Hearings have a date but no time (the cause list sets the order on the
 * day), so the event is an all-day one, with a reminder at 9 am the day
 * before.
 */

export type HearingEvent = {
  /** Stable per case and date, so adding the same hearing twice updates it. */
  uid: string;
  /** YYYY-MM-DD. */
  date: string;
  title: string;
  location?: string | null;
  description?: string | null;
  /** When the file is generated, for DTSTAMP. */
  now?: Date;
};

/** Backslash, semicolon, comma and line breaks are escaped in TEXT values. */
export function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Lines over 75 octets continue on the next line after a single space. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const bytes = Buffer.byteLength(char);
    // The first line may hold 75 octets; continuations hold 74 after the space.
    if (size + bytes > (parts.length === 0 ? 75 : 74)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

const compactDate = (date: string) => date.replace(/-/g, "");

function nextDay(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

function stamp(now: Date): string {
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function hearingIcs(event: HearingEvent): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) throw new Error(`Not a date: ${event.date}`);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ADOORA Legal Services//Case portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(event.now ?? new Date())}`,
    `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
    `DTEND;VALUE=DATE:${compactDate(nextDay(event.date))}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)}`,
    // Relative to the start of the all-day event (midnight): 9 am the day before.
    "TRIGGER:-PT15H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
