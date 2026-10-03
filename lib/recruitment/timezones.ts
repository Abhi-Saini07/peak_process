/**
 * Timezone maths with the built-in Intl API (no date library). Works for any
 * IANA zone, DST included, by asking Intl what the wall clock reads in that
 * zone at a given instant.
 */

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; weekday: number };

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** The wall-clock date and time in `timeZone` at `instant` (weekday 0 = Sunday). */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = Object.fromEntries(partsFormatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAY[parts.weekday as string],
  };
}

/** Minutes the zone is ahead of UTC at `instant` (e.g. +330 for Asia/Kolkata). */
export function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(instant.getTime() / 60000) * 60000) / 60000);
}

/** The instant when the wall clock in `timeZone` reads the given date and time. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  let instant = guess - tzOffsetMinutes(new Date(guess), timeZone) * 60000;
  // A second pass settles instants near a DST change.
  instant = guess - tzOffsetMinutes(new Date(instant), timeZone) * 60000;
  return new Date(instant);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The office timezone for interviews: INTERVIEW_TIMEZONE, default Asia/Kolkata. */
export function officeTimeZone(): string {
  const tz = process.env.INTERVIEW_TIMEZONE?.trim();
  return tz && isValidTimeZone(tz) ? tz : "Asia/Kolkata";
}

/*
 * Display formatting. Labels are assembled from formatToParts() rather than
 * format(): Node and browsers ship different ICU data and disagree on the
 * punctuation of whole strings ("Monday, 5 October" vs "Monday 5 October"),
 * which breaks hydration when a client component renders a date on the server.
 */
type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>;

function parts(instant: Date, timeZone: string, options: Intl.DateTimeFormatOptions): Parts {
  const out: Parts = {};
  for (const p of new Intl.DateTimeFormat("en-GB", { timeZone, ...options }).formatToParts(instant)) out[p.type] = p.value;
  return out;
}

/** "Monday 5 October" (long) or "5 Oct" (short) in the given zone. */
export function formatDayLabel(instant: Date, timeZone: string, style: "long" | "short" = "long"): string {
  if (style === "short") {
    const p = parts(instant, timeZone, { day: "numeric", month: "short" });
    return `${p.day} ${p.month}`;
  }
  const p = parts(instant, timeZone, { weekday: "long", day: "numeric", month: "long" });
  return `${p.weekday} ${p.day} ${p.month}`;
}

/** "9:30 am" in the given zone. */
export function formatTimeLabel(instant: Date, timeZone: string): string {
  const p = parts(instant, timeZone, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${Number(p.hour)}:${p.minute} ${(p.dayPeriod ?? "").toLowerCase()}`.trim();
}

/** "Tue, 7 Oct 2026, 10:30 am" in the given zone (no zone name: say it once nearby). */
export function formatShortDateTime(instant: Date, timeZone: string): string {
  const p = parts(instant, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${p.weekday}, ${p.day} ${p.month} ${p.year}, ${formatTimeLabel(instant, timeZone)}`;
}

/** "Tue, 7 Oct 2026, 10:30 am IST": for emails, which are rendered once on the server. */
export function formatInTimeZone(instant: Date, timeZone: string): string {
  const zone = parts(instant, timeZone, { timeZoneName: "short" }).timeZoneName;
  const name = timeZone === "Asia/Kolkata" ? "IST" : zone;
  return `${formatShortDateTime(instant, timeZone)}${name ? ` ${name}` : ""}`;
}

/** "5 Oct 2026" in the given zone. */
export function formatDateLabel(instant: Date, timeZone: string): string {
  const p = parts(instant, timeZone, { day: "numeric", month: "short", year: "numeric" });
  return `${p.day} ${p.month} ${p.year}`;
}
