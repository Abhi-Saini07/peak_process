import { formatDayLabel, formatTimeLabel, zonedParts, zonedTimeToUtc } from "./timezones";

/**
 * Open interview slots for a scheduling link. Pure, so the page that lists
 * slots and the API that books one compute exactly the same list: a booking
 * is accepted only if its time is in this list at the moment of booking.
 *
 * Rules: Monday–Friday, 09:00–17:00 office time, a slot every 30 minutes,
 * the whole interview inside working hours, at least 24 hours from now,
 * inside the invite's window, and never overlapping the interviewer's other
 * scheduled interviews.
 */

export type SlotRules = {
  timeZone: string;
  dayStartMinutes: number;
  dayEndMinutes: number;
  stepMinutes: number;
  minNoticeHours: number;
};

export const DEFAULT_SLOT_RULES: Omit<SlotRules, "timeZone"> = {
  dayStartMinutes: 9 * 60,
  dayEndMinutes: 17 * 60,
  stepMinutes: 30,
  minNoticeHours: 24,
};

export type BusyRange = { start: Date; end: Date };

export type SlotInput = {
  now: Date;
  windowStart: Date;
  windowEnd: Date;
  durationMinutes: number;
  busy: readonly BusyRange[];
  rules: SlotRules;
  /** Safety cap on how many slots to return. */
  limit?: number;
};

const MINUTE = 60_000;

function overlaps(start: number, end: number, busy: readonly BusyRange[]): boolean {
  return busy.some((b) => start < b.end.getTime() && b.start.getTime() < end);
}

export function generateSlots(input: SlotInput): Date[] {
  const { now, windowStart, windowEnd, durationMinutes, busy, rules } = input;
  const limit = input.limit ?? 500;
  const earliest = Math.max(windowStart.getTime(), now.getTime() + rules.minNoticeHours * 60 * MINUTE);
  const latest = windowEnd.getTime();
  if (earliest >= latest || durationMinutes <= 0) return [];

  const slots: Date[] = [];
  // Walk the office-calendar days from the first possible day to the window's last.
  const first = zonedParts(new Date(earliest), rules.timeZone);
  const last = zonedParts(new Date(latest), rules.timeZone);
  const day = new Date(Date.UTC(first.year, first.month - 1, first.day));
  const lastDay = Date.UTC(last.year, last.month - 1, last.day);

  for (; day.getTime() <= lastDay && slots.length < limit; day.setUTCDate(day.getUTCDate() + 1)) {
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (let m = rules.dayStartMinutes; m + durationMinutes <= rules.dayEndMinutes; m += rules.stepMinutes) {
      const start = zonedTimeToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), Math.floor(m / 60), m % 60, rules.timeZone);
      const s = start.getTime();
      const e = s + durationMinutes * MINUTE;
      if (s < earliest || e > latest) continue;
      if (overlaps(s, e, busy)) continue;
      slots.push(start);
      if (slots.length >= limit) break;
    }
  }
  return slots;
}

/** Whether `candidate` is exactly one of the offered slots. */
export function isOfferedSlot(candidate: Date, slots: readonly Date[]): boolean {
  const t = candidate.getTime();
  return slots.some((s) => s.getTime() === t);
}

export type SlotDay = { key: string; label: string; slots: { iso: string; label: string }[] };

/**
 * Groups ISO slot instants by calendar day in `timeZone` (the viewer's own
 * zone on the public page), with display labels, keeping the input order.
 */
export function groupSlotsByDay(slots: readonly string[], timeZone: string): SlotDay[] {
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const days = new Map<string, SlotDay>();
  for (const iso of slots) {
    const instant = new Date(iso);
    const key = dayKey.format(instant);
    let day = days.get(key);
    if (!day) {
      day = { key, label: formatDayLabel(instant, timeZone), slots: [] };
      days.set(key, day);
    }
    day.slots.push({ iso, label: formatTimeLabel(instant, timeZone) });
  }
  return [...days.values()];
}
