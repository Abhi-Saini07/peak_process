/**
 * Rejection reasons and the one validator shared by the reason picker (client)
 * and the status API route (server). No Prisma imports: unit-testable.
 */

export const REJECT_REASON_OPTIONS = [
  { value: "skills_experience", label: "Skills or experience" },
  { value: "location_workmode", label: "Location or work mode" },
  { value: "compensation", label: "Compensation" },
  { value: "failed_knockout", label: "Failed screening questions" },
  { value: "stronger_candidates", label: "Stronger candidates" },
  { value: "incomplete_unresponsive", label: "Incomplete or unresponsive" },
  { value: "withdrew", label: "Candidate withdrew" },
  { value: "other", label: "Other" },
] as const;

export type RejectReason = (typeof REJECT_REASON_OPTIONS)[number]["value"];

export const REJECT_REASON_VALUES = REJECT_REASON_OPTIONS.map((o) => o.value) as [RejectReason, ...RejectReason[]];

export const REJECT_NOTE_MAX = 1000;

export function rejectReasonLabel(value: string): string {
  return REJECT_REASON_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** Number key "1"–"8" → the reason at that position, for the picker's shortcuts. */
export function rejectReasonForShortcut(key: string): RejectReason | null {
  const index = Number(key) - 1;
  return Number.isInteger(index) && index >= 0 && index < REJECT_REASON_OPTIONS.length
    ? REJECT_REASON_OPTIONS[index].value
    : null;
}

export type RejectInput = { reason: RejectReason; note: string | null };

export type RejectValidation = { ok: true; value: RejectInput } | { ok: false; error: string };

/** A reason is required; "other" also needs a note. The note is trimmed, and empty means none. */
export function validateRejectInput(input: { reason?: unknown; note?: unknown }): RejectValidation {
  const reason = typeof input.reason === "string" ? input.reason : "";
  if (!REJECT_REASON_VALUES.includes(reason as RejectReason)) {
    return { ok: false, error: "Choose a reason for rejecting this application." };
  }
  if (input.note != null && typeof input.note !== "string") {
    return { ok: false, error: "The note must be text." };
  }
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > REJECT_NOTE_MAX) {
    return { ok: false, error: `Keep the note under ${REJECT_NOTE_MAX} characters.` };
  }
  if (reason === "other" && note.length === 0) {
    return { ok: false, error: "Add a short note when the reason is “Other”." };
  }
  return { ok: true, value: { reason: reason as RejectReason, note: note || null } };
}
