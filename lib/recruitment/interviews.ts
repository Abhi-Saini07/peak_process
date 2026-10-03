import { z } from "zod";
import { formatDayLabel } from "./timezones";

/** Interview forms and labels. Pure: shared by the dialogs and the API routes. */

export const INTERVIEW_MODE_OPTIONS = [
  { value: "video", label: "Video call" },
  { value: "phone", label: "Phone call" },
  { value: "onsite", label: "In person" },
] as const;
export type InterviewMode = (typeof INTERVIEW_MODE_OPTIONS)[number]["value"];
export const interviewModeLabel = (mode: string) => INTERVIEW_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;

export const INTERVIEW_STATUS_LABEL = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
} as const;
export type InterviewStatus = keyof typeof INTERVIEW_STATUS_LABEL;

export const DURATION_OPTIONS = [30, 45, 60, 90] as const;

const mode = z.enum(["video", "phone", "onsite"], { error: "Choose a format." });
const duration = z.coerce.number().int().min(15, "At least 15 minutes.").max(240, "At most 4 hours.");
const optionalUrl = z.union([z.literal(""), z.url("Enter a full link, starting with https://").max(500)]).default("");
const optionalText = (max: number) => z.string().trim().max(max).default("");

/** Shared rule: video calls need a link, in-person interviews need a place. */
function requireMeetingDetails<T extends { mode: string; meetingUrl: string; location: string }>(v: T, ctx: z.RefinementCtx) {
  if (v.mode === "video" && !v.meetingUrl) ctx.addIssue({ code: "custom", path: ["meetingUrl"], message: "Add the video call link." });
  if (v.mode === "onsite" && !v.location) ctx.addIssue({ code: "custom", path: ["location"], message: "Add where the interview is." });
}

export const manualInterviewSchema = z
  .object({
    /** ISO instant; the form converts the admin's local date/time before sending. */
    scheduledAt: z.iso.datetime({ offset: true, error: "Pick a date and time." }),
    durationMinutes: duration,
    mode,
    interviewerAdminId: z.string().length(36, "Choose an interviewer."),
    meetingUrl: optionalUrl,
    location: optionalText(255),
    notes: optionalText(2000),
    notifyCandidate: z.boolean().default(true),
  })
  .superRefine(requireMeetingDetails);
export type ManualInterviewInput = z.output<typeof manualInterviewSchema>;

export const scheduleInviteSchema = z
  .object({
    interviewerAdminId: z.string().length(36, "Choose an interviewer."),
    durationMinutes: duration,
    mode,
    meetingUrl: optionalUrl,
    location: optionalText(255),
    /** yyyy-mm-dd, office calendar days, inclusive. */
    windowStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date."),
    windowEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date."),
  })
  .superRefine(requireMeetingDetails)
  .refine((v) => v.windowEndDate >= v.windowStartDate, { path: ["windowEndDate"], message: "The end date is before the start date." });
export type ScheduleInviteInput = z.output<typeof scheduleInviteSchema>;

export const interviewStatusUpdateSchema = z.object({
  status: z.enum(["completed", "cancelled", "no_show"]),
  notifyCandidate: z.boolean().default(true),
});

/** Moves allowed on an interview: scheduled → completed / cancelled / no_show; others are final. */
export function canChangeInterviewStatus(from: InterviewStatus, to: InterviewStatus): boolean {
  return from === "scheduled" && to !== "scheduled";
}

/** Groups rows by calendar day in `timeZone`, keeping their order. "Today"/"Tomorrow" relative to `now`. */
export function groupByDay<T extends { scheduledAt: string }>(
  rows: readonly T[],
  timeZone: string,
  now: number,
): { key: string; label: string; items: T[] }[] {
  const keyOf = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const today = keyOf.format(new Date(now));
  const tomorrow = keyOf.format(new Date(now + 86_400_000));
  const groups = new Map<string, { key: string; label: string; items: T[] }>();
  for (const row of rows) {
    const instant = new Date(row.scheduledAt);
    const key = keyOf.format(instant);
    let group = groups.get(key);
    if (!group) {
      const base = formatDayLabel(instant, timeZone);
      group = { key, label: key === today ? `Today · ${base}` : key === tomorrow ? `Tomorrow · ${base}` : base, items: [] };
      groups.set(key, group);
    }
    group.items.push(row);
  }
  return [...groups.values()];
}
