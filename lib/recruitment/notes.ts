import { z } from "zod";
import type { ApplicationNoteEntry, ApplicationStatusHistoryEntry } from "@/types/recruitment";

/**
 * HR notes and the Activity timeline. Pure: shared by the note composer, the
 * notes API route and the detail page. No Prisma imports.
 */

export const NOTE_BODY_MAX = 5000;

export const noteInputSchema = z.object({
  body: z
    .string({ error: "Write a note." })
    .trim()
    .min(1, "Write a note.")
    .max(NOTE_BODY_MAX, `Keep the note under ${NOTE_BODY_MAX} characters.`),
  rating: z
    .number()
    .int()
    .min(1, "Ratings go from 1 to 5.")
    .max(5, "Ratings go from 1 to 5.")
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export type NoteInput = z.output<typeof noteInputSchema>;

export type ActivityItem =
  | { kind: "status"; id: string; at: string; entry: ApplicationStatusHistoryEntry }
  | { kind: "note"; id: string; at: string; note: ApplicationNoteEntry };

/** Status changes and notes merged into one list, newest first. Ties keep
 *  status changes above notes so a "rejected" row sits above its follow-up. */
export function buildActivityTimeline(
  history: readonly ApplicationStatusHistoryEntry[],
  notes: readonly ApplicationNoteEntry[],
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...history.map((entry) => ({ kind: "status" as const, id: `s-${entry.id}`, at: entry.changedAt, entry })),
    ...notes.map((note) => ({ kind: "note" as const, id: `n-${note.id}`, at: note.createdAt, note })),
  ];
  return items.sort((a, b) => {
    const diff = Date.parse(b.at) - Date.parse(a.at);
    if (diff !== 0) return diff;
    return a.kind === b.kind ? 0 : a.kind === "status" ? -1 : 1;
  });
}

/** Mean of the rated notes, one decimal, or null when none are rated. */
export function averageRating(notes: readonly ApplicationNoteEntry[]): number | null {
  const ratings = notes.map((n) => n.rating).filter((r): r is number => r != null);
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
}
