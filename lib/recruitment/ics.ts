/**
 * iCalendar (RFC 5545) for one interview: CRLF line endings, lines folded at
 * 75 octets, and TEXT values escaped (backslash, semicolon, comma, newline).
 */

export type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  /** CANCELLED tells calendar apps to remove the event. */
  status?: "CONFIRMED" | "CANCELLED";
  sequence?: number;
  stamp?: Date;
};

/** RFC 5545 §3.3.11: escape \\ ; , and newlines in TEXT values. */
export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after CRLF + space. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const max = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (currentBytes + bytes > max) {
      out.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** 20261007T050000Z */
export function icsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildIcs(event: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Peak Process Partners//Interviews//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${event.status === "CANCELLED" ? "CANCEL" : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${icsUtc(event.stamp ?? new Date())}`,
    `DTSTART:${icsUtc(event.start)}`,
    `DTEND:${icsUtc(event.end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    ...(event.description ? [`DESCRIPTION:${escapeIcsText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeIcsText(event.location)}`] : []),
    ...(event.url ? [`URL:${event.url}`] : []),
    `STATUS:${event.status ?? "CONFIRMED"}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
