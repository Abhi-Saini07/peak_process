import { applicationStatusLabel, type ApplicationStatus } from "./constants";
import { daysSince, STAGE_WARNING_DAYS } from "./board";
import { isTerminalStage, STAGE_ORDER } from "./stages";

/**
 * Recruiter dashboard maths. Pure: lib/server/dashboardRepository.ts fetches
 * counts and rows, these functions turn them into what the widgets show.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export const NO_NEW_APPLICANTS_DAYS = 14;
export const DEADLINE_SOON_DAYS = 7;

/** Start of the current calendar month (UTC), for "selected this month". */
export function startOfMonthUTC(now: number): Date {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** [start, end) windows for "last 7 days" and "the 7 before that". */
export function weekWindows(now: number): { current: { from: Date; to: Date }; previous: { from: Date; to: Date } } {
  const to = new Date(now);
  const mid = new Date(now - 7 * DAY_MS);
  const from = new Date(now - 14 * DAY_MS);
  return { current: { from: mid, to }, previous: { from, to: mid } };
}

export type Trend = { delta: number; percent: number | null; direction: "up" | "down" | "flat" };

/** Change from `previous` to `current`; percent is null when there's nothing to compare against. */
export function compareCounts(current: number, previous: number): Trend {
  const delta = current - previous;
  return {
    delta,
    percent: previous === 0 ? null : Math.round((delta / previous) * 100),
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

export type StuckApplicationInput = {
  id: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  status: ApplicationStatus;
  stageEnteredAt: string;
};

export type StuckApplication = StuckApplicationInput & { days: number; reason: string };

/** Non-terminal applications sitting in their stage for 7+ days, oldest first. */
export function needsAttention(items: readonly StuckApplicationInput[], now: number, limit = 8): StuckApplication[] {
  return items
    .filter((item) => !isTerminalStage(item.status))
    .map((item) => {
      const days = daysSince(item.stageEnteredAt, now);
      return { ...item, days, reason: `Stuck in ${applicationStatusLabel(item.status)} for ${days} days` };
    })
    .filter((item) => item.days >= STAGE_WARNING_DAYS)
    .sort((a, b) => b.days - a.days || a.stageEnteredAt.localeCompare(b.stageEnteredAt))
    .slice(0, limit);
}

export type JobHealthInput = {
  id: string;
  title: string;
  publishedAt: string | null;
  /** yyyy-mm-dd */
  deadline: string | null;
  lastAppliedAt: string | null;
  countsByStatus: Partial<Record<ApplicationStatus, number>>;
};

export type JobHealthWarning = { kind: "no_new_applicants" | "deadline_soon" | "deadline_passed"; label: string };

export type JobHealth = {
  id: string;
  title: string;
  daysOpen: number | null;
  total: number;
  stages: { status: ApplicationStatus; count: number }[];
  warnings: JobHealthWarning[];
};

/** Whole days from today (UTC) until a yyyy-mm-dd deadline; negative once it has passed. */
export function daysUntilDeadline(deadline: string, now: number): number {
  const today = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate());
  return Math.round((Date.parse(`${deadline}T00:00:00Z`) - today) / DAY_MS);
}

export function jobHealth(job: JobHealthInput, now: number): JobHealth {
  const stages = STAGE_ORDER.map((status) => ({ status, count: job.countsByStatus[status] ?? 0 }));
  const warnings: JobHealthWarning[] = [];

  // Quiet for 14 days, counted from the last application, or from publishing if none yet.
  const quietSince = job.lastAppliedAt ?? job.publishedAt;
  if (quietSince && daysSince(quietSince, now) >= NO_NEW_APPLICANTS_DAYS) {
    warnings.push({ kind: "no_new_applicants", label: `No new applicants in ${NO_NEW_APPLICANTS_DAYS} days` });
  }
  if (job.deadline) {
    const left = daysUntilDeadline(job.deadline, now);
    if (left < 0) warnings.push({ kind: "deadline_passed", label: "Deadline passed" });
    else if (left <= DEADLINE_SOON_DAYS) {
      warnings.push({
        kind: "deadline_soon",
        label: left === 0 ? "Deadline today" : `Deadline in ${left} ${left === 1 ? "day" : "days"}`,
      });
    }
  }

  return {
    id: job.id,
    title: job.title,
    daysOpen: job.publishedAt ? daysSince(job.publishedAt, now) : null,
    total: stages.reduce((sum, s) => sum + s.count, 0),
    stages,
    warnings,
  };
}
