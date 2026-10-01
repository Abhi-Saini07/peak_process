/**
 * MySQL DATE columns have no time/timezone component, but Prisma reads
 * them back as JS Date objects. Reading/writing with UTC getters (instead
 * of local-timezone ones) avoids an off-by-one-day shift depending on the
 * server's timezone — the date "2026-09-22" must round-trip as exactly
 * that string, not drift to the 21st or 23rd.
 */

export function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}
