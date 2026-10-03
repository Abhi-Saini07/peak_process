import type { ApplicationStatus } from "./constants";
import { canMoveDirectly } from "./stages";

/**
 * Kanban board rules: column order, the per-column card limit and the
 * days-in-stage badge. Pure, so the board and the dashboard share them.
 */

export type BoardColumn = { status: ApplicationStatus; collapsedByDefault: boolean };

export const BOARD_COLUMNS: readonly BoardColumn[] = [
  { status: "applied", collapsedByDefault: false },
  { status: "under_review", collapsedByDefault: false },
  { status: "shortlisted", collapsedByDefault: false },
  { status: "interview", collapsedByDefault: false },
  { status: "offered", collapsedByDefault: false },
  { status: "selected", collapsedByDefault: true },
  { status: "rejected", collapsedByDefault: true },
];

export const COLUMN_CARD_LIMIT = 20;
export const STAGE_WARNING_DAYS = 7;
export const STAGE_DANGER_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since `sinceISO`, never negative. */
export function daysSince(sinceISO: string, now: number): number {
  return Math.max(0, Math.floor((now - Date.parse(sinceISO)) / DAY_MS));
}

export type StageAgeTone = "neutral" | "warning" | "danger";

export function stageAgeTone(days: number): StageAgeTone {
  if (days >= STAGE_DANGER_DAYS) return "danger";
  if (days >= STAGE_WARNING_DAYS) return "warning";
  return "neutral";
}

type BoardItem = { id: string; status: ApplicationStatus; stageEnteredAt: string };

export type BoardColumnData<T> = { status: ApplicationStatus; visible: T[]; hiddenCount: number; total: number };

/** Groups items into the board's columns, longest in stage first, capped at COLUMN_CARD_LIMIT. */
export function groupIntoColumns<T extends BoardItem>(items: readonly T[], limit = COLUMN_CARD_LIMIT): BoardColumnData<T>[] {
  return BOARD_COLUMNS.map(({ status }) => {
    const inColumn = items
      .filter((item) => item.status === status)
      .sort((a, b) => a.stageEnteredAt.localeCompare(b.stageEnteredAt));
    return {
      status,
      visible: inColumn.slice(0, limit),
      hiddenCount: Math.max(0, inColumn.length - limit),
      total: inColumn.length,
    };
  });
}

/** Columns a card in `from` may be dropped on. */
export function dropTargetsFor(from: ApplicationStatus): ApplicationStatus[] {
  return BOARD_COLUMNS.map((c) => c.status).filter((to) => canMoveDirectly(from, to));
}
