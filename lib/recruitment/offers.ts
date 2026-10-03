import { z } from "zod";

/**
 * Offers: what the offer form collects and how old an offer is. Pure, shared
 * by the offer form, the offer API route and the dashboard.
 */

export const OFFER_NOTE_MAX = 2000;
const DAY_MS = 24 * 60 * 60 * 1000;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.");

export const offerInputSchema = z
  .object({
    salary: z.coerce
      .number({ error: "Enter the yearly salary." })
      .int("Use a whole number.")
      .min(1, "Enter the yearly salary.")
      .max(1_000_000_000, "That salary looks too large."),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code, like INR."),
    startDate: isoDate,
    expiresOn: isoDate,
    note: z.string().trim().max(OFFER_NOTE_MAX, `Keep the note under ${OFFER_NOTE_MAX} characters.`).default(""),
  })
  .refine((o) => o.expiresOn <= o.startDate, {
    message: "The offer should expire on or before the start date.",
    path: ["expiresOn"],
  });

export type OfferInput = z.input<typeof offerInputSchema>;
export type OfferDetails = z.output<typeof offerInputSchema>;

/** Today (UTC) as yyyy-mm-dd, to compare with date-only fields. */
export function todayISO(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Server-side extra check: an offer can't already be expired when it's made. */
export function validateOfferDates(offer: OfferDetails, now: number): string | null {
  if (offer.expiresOn < todayISO(now)) return "The expiry date is in the past.";
  return null;
}

/** Lenient read of the JobApplication.offerDetails JSON column. */
export function parseOfferDetails(value: unknown): OfferDetails | null {
  const parsed = offerInputSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Whole days until a yyyy-mm-dd date (negative once it has passed). */
export function daysUntil(dateISO: string, now: number): number {
  return Math.round((Date.parse(`${dateISO}T00:00:00Z`) - Date.parse(`${todayISO(now)}T00:00:00Z`)) / DAY_MS);
}

export type OfferAge = "fresh" | "aging" | "stale" | "expiring" | "expired";

export const OFFER_AGE_LABEL: Record<OfferAge, string> = {
  fresh: "Fresh",
  aging: "Aging",
  stale: "Stale",
  expiring: "Expiring",
  expired: "Expired",
};

/**
 * Expired: past its expiry date. Expiring: expires within 2 days. Otherwise
 * by days since it was sent: fresh under 3, aging 3–6, stale 7+.
 */
export function offerAge(sentAtISO: string, expiresOn: string, now: number): OfferAge {
  const left = daysUntil(expiresOn, now);
  if (left < 0) return "expired";
  if (left <= 2) return "expiring";
  const days = Math.floor((now - Date.parse(sentAtISO)) / DAY_MS);
  if (days >= 7) return "stale";
  if (days >= 3) return "aging";
  return "fresh";
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}
