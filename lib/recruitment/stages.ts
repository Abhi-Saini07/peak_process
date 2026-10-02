import type { ApplicationStatus } from "./constants";

/**
 * The one place that decides which application status moves are legal.
 * Forward path: applied → under_review → shortlisted → interview → selected,
 * one step at a time. "rejected" is reachable from any non-terminal stage.
 * "selected" and "rejected" are terminal. Used by the status API route (422
 * on anything else), the detail-page actions and the Kanban board.
 */
export const STAGE_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  applied: ["under_review", "rejected"],
  under_review: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["selected", "rejected"],
  selected: [],
  rejected: [],
};

/** Pipeline order, for columns and sorting. */
export const STAGE_ORDER: readonly ApplicationStatus[] = [
  "applied",
  "under_review",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return STAGE_TRANSITIONS[from].includes(to);
}

export function isTerminalStage(status: ApplicationStatus): boolean {
  return STAGE_TRANSITIONS[status].length === 0;
}

/** Legal next statuses from `from`, forward step first, "rejected" last. */
export function nextStages(from: ApplicationStatus): readonly ApplicationStatus[] {
  return STAGE_TRANSITIONS[from];
}
