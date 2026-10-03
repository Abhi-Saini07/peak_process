"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { ArrowRight, ChevronsLeftRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applicationStatusLabel, type ApplicationStatus } from "@/lib/recruitment/constants";
import { canMoveDirectly } from "@/lib/recruitment/stages";
import { daysSince, dropTargetsFor, stageAgeTone, type StageAgeTone } from "@/lib/recruitment/board";
import { useApplicationsBoard } from "@/hooks/recruitment/useApplicationsBoard";
import { RejectReasonDialog } from "@/components/nocturne/recruitment/RejectReasonDialog";
import { ScreeningFlagBadge, adminLabelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { ApplicationSummary } from "@/types/recruitment";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const AGE_TONE: Record<StageAgeTone, string> = {
  neutral: "bg-nocturne-raised text-nocturne-ink-muted",
  warning: "bg-nocturne-gold-tint text-nocturne-gold",
  danger: "bg-nocturne-error-tint text-nocturne-error",
};

function DaysInStage({ days }: { days: number }) {
  return (
    <span
      className={cn(
        "nocturne-mono inline-flex h-6 items-center rounded-nocturne-pill px-2 text-[0.6875rem] font-semibold",
        AGE_TONE[stageAgeTone(days)],
      )}
      title={`${days} ${days === 1 ? "day" : "days"} in this stage`}
    >
      {days}d<span className="sr-only"> in stage</span>
    </span>
  );
}

function CardBody({ app, now }: { app: ApplicationSummary; now: number }) {
  return (
    <>
      <p className="truncate text-sm font-bold text-nocturne-ink">{app.candidateName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-nocturne-ink-muted">
          Applied <span className="nocturne-mono font-medium text-nocturne-ink">{formatDate(app.appliedAt)}</span>
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {app.knockoutFlagged && <ScreeningFlagBadge compact className="h-6 px-2" />}
          <DaysInStage days={daysSince(app.stageEnteredAt, now)} />
        </span>
      </div>
    </>
  );
}

const cardClass =
  "rounded-nocturne-control border border-nocturne-border bg-nocturne-card px-3.5 py-3 shadow-nocturne-rest in-data-[theme=dark]:bg-nocturne-raised";

function BoardCard({ app, now, pending }: { app: ApplicationSummary; now: number; pending: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id, disabled: pending });
  return (
    <li>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        aria-roledescription="Draggable application"
        aria-label={`${app.candidateName}, ${applicationStatusLabel(app.status)}. Press space to move.`}
        className={cn(
          cardClass,
          "relative cursor-grab touch-manipulation transition-[border-color,box-shadow,opacity] hover:border-nocturne-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent active:cursor-grabbing",
          isDragging && "opacity-40",
          pending && "cursor-progress opacity-70",
        )}
      >
        <CardBody app={app} now={now} />
        <Link
          href={`/admin/applications/${app.id}`}
          // Keyboard users open the application from here; the card itself is the drag handle.
          className="mt-2 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-nocturne-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-nocturne-accent"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          Open <ArrowRight className="size-3" aria-hidden />
        </Link>
        {pending && <Loader2 className="absolute top-3 right-3 size-3.5 animate-spin text-nocturne-ink-muted" aria-hidden />}
      </div>
    </li>
  );
}

function BoardColumnShell({
  status,
  total,
  expanded,
  onToggle,
  dragState,
  children,
}: {
  status: ApplicationStatus;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  dragState: "idle" | "valid" | "invalid";
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: dragState === "invalid" });
  const label = applicationStatusLabel(status);
  const ring =
    dragState === "valid"
      ? isOver
        ? "border-nocturne-accent bg-nocturne-accent-tint shadow-nocturne-glow"
        : "border-dashed border-nocturne-accent"
      : "border-nocturne-border";

  if (!expanded) {
    return (
      <section
        ref={setNodeRef}
        aria-label={`${label}, ${total} ${total === 1 ? "application" : "applications"}, collapsed`}
        className={cn(
          "flex w-14 shrink-0 flex-col items-center gap-3 rounded-nocturne-card border bg-nocturne-surface py-3 transition-[border-color,background-color,opacity,box-shadow]",
          ring,
          dragState === "invalid" && "opacity-50",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label={`Show ${label} column`}
          className="inline-flex size-8 items-center justify-center rounded-nocturne-pill text-nocturne-ink-muted hover:bg-nocturne-raised hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-nocturne-accent"
        >
          <ChevronsLeftRight className="size-4" aria-hidden />
        </button>
        <span className="nocturne-mono inline-flex h-6 min-w-6 items-center justify-center rounded-nocturne-pill bg-nocturne-card px-1.5 text-xs font-semibold text-nocturne-ink">
          {total}
        </span>
        <span className="text-sm font-bold text-nocturne-ink [writing-mode:vertical-rl]" aria-hidden>
          {label}
        </span>
      </section>
    );
  }

  return (
    <section
      ref={setNodeRef}
      aria-label={`${label}, ${total} ${total === 1 ? "application" : "applications"}`}
      className={cn(
        "flex w-[17.5rem] shrink-0 flex-col rounded-nocturne-card border bg-nocturne-surface transition-[border-color,background-color,opacity,box-shadow]",
        ring,
        dragState === "invalid" && "opacity-50",
      )}
    >
      <header className="flex items-center gap-2 px-3.5 pt-3.5 pb-2.5">
        <h2 className="text-sm font-bold text-nocturne-ink">{label}</h2>
        <span className="nocturne-mono inline-flex h-6 min-w-6 items-center justify-center rounded-nocturne-pill bg-nocturne-card px-1.5 text-xs font-semibold text-nocturne-ink-muted">
          {total}
        </span>
        {(status === "selected" || status === "rejected") && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded
            aria-label={`Collapse ${label} column`}
            className="ml-auto inline-flex size-7 items-center justify-center rounded-nocturne-pill text-nocturne-ink-muted hover:bg-nocturne-raised hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-nocturne-accent"
          >
            <ChevronsLeftRight className="size-4" aria-hidden />
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

/** Mouse and pen drag after a 6px move. Touch is left to TouchSensor (press
 *  and hold), so a swipe that starts on a card still scrolls the page. */
class MousePenSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) =>
        nativeEvent.pointerType !== "touch" && nativeEvent.isPrimary && nativeEvent.button === 0,
    },
  ];
}

/** Arrow keys jump the dragged card to the nearest allowed column on that side
 *  (disallowed columns are disabled drop targets, so they are skipped). */
const columnKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context }) => {
  const { collisionRect, droppableRects, droppableContainers, over } = context;
  if (!collisionRect || (event.code !== "ArrowRight" && event.code !== "ArrowLeft")) return undefined;
  event.preventDefault();
  // Measure from the column the card is over (columns differ in width), else the card itself.
  const currentLeft = (over ? droppableRects.get(over.id)?.left : undefined) ?? collisionRect.left;
  const columns = droppableContainers
    .getEnabled()
    .map((container) => droppableRects.get(container.id))
    .filter((rect): rect is NonNullable<typeof rect> => Boolean(rect))
    .filter((rect) => (event.code === "ArrowRight" ? rect.left > currentLeft + 1 : rect.left < currentLeft - 1))
    .sort((a, b) => (event.code === "ArrowRight" ? a.left - b.left : b.left - a.left));
  const target = columns[0];
  if (!target) return undefined;
  return { x: target.left + Math.max(0, (target.width - collisionRect.width) / 2), y: target.top + 48 };
};

/** Kanban view of one job's applications. Only moves STAGE_TRANSITIONS allows
 *  can be dropped; valid columns are outlined while a card is dragged. */
export function AdminApplicationsBoardNocturne({
  applications,
  now,
  onViewInList,
}: {
  applications: ApplicationSummary[];
  /** Server time (ms) so days-in-stage matches between server and client render. */
  now: number;
  onViewInList: (status: ApplicationStatus) => void;
}) {
  const board = useApplicationsBoard(applications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MousePenSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: columnKeyboardCoordinates }),
  );

  const active = activeId ? board.items.find((a) => a.id === activeId) ?? null : null;
  const validTargets = active ? dropTargetsFor(active.status) : [];
  const nameOf = (id: string | number) => board.items.find((a) => a.id === id)?.candidateName ?? "Application";
  const statusOf = (id: string | number) => board.items.find((a) => a.id === id)?.status;

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${nameOf(a.id)}. Use the arrow keys to choose a column.`,
    onDragOver: ({ active: a, over }) => {
      if (!over) return `${nameOf(a.id)} is not over a column.`;
      const from = statusOf(a.id);
      const to = over.id as ApplicationStatus;
      const allowed = from ? canMoveDirectly(from, to) : false;
      return `${nameOf(a.id)} is over ${applicationStatusLabel(to)}${allowed ? "" : ", which isn't allowed from here"}.`;
    },
    onDragEnd: ({ active: a, over }) =>
      over ? `${nameOf(a.id)} dropped on ${applicationStatusLabel(over.id as ApplicationStatus)}.` : `${nameOf(a.id)} dropped. No change.`,
    onDragCancel: ({ active: a }) => `Moving ${nameOf(a.id)} was cancelled.`,
  };

  return (
    <div className="mt-6">
      {board.error && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-3 rounded-nocturne-control bg-nocturne-error-tint px-4 py-3 text-sm text-nocturne-error"
        >
          <p className="flex-1">{board.error}</p>
          <button
            type="button"
            onClick={board.dismissError}
            aria-label="Dismiss"
            className="rounded-sm hover:opacity-80 focus-visible:outline-2 focus-visible:outline-nocturne-accent"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      <p className="sr-only" id="board-help">
        Focus a card and press space to pick it up, the arrow keys to move between columns, then space to drop or escape to
        cancel.
      </p>

      <DndContext
        sensors={sensors}
        accessibility={{ announcements }}
        onDragStart={({ active: a }) => setActiveId(String(a.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={({ active: a, over }) => {
          setActiveId(null);
          if (over) board.moveCard(String(a.id), over.id as ApplicationStatus);
        }}
      >
        {/* The board scrolls sideways inside its own box, never the page. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-3" aria-describedby="board-help">
          <div className="flex min-w-max items-start gap-3">
            {board.columns.map((column) => {
              const dragState = !active
                ? "idle"
                : validTargets.includes(column.status)
                  ? "valid"
                  : "invalid";
              const expanded = board.isExpanded(column.status);
              return (
                <BoardColumnShell
                  key={column.status}
                  status={column.status}
                  total={column.total}
                  expanded={expanded}
                  onToggle={() => board.toggleExpanded(column.status)}
                  dragState={active && column.status === active.status ? "idle" : dragState}
                >
                  {column.total === 0 ? (
                    <p className="mx-3.5 mb-3.5 rounded-nocturne-control border border-dashed border-nocturne-border px-3 py-6 text-center text-xs text-nocturne-ink-faint">
                      No applications
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2 px-2.5 pb-2.5">
                      {column.visible.map((app) => (
                        <BoardCard key={app.id} app={app} now={now} pending={board.pendingIds.has(app.id)} />
                      ))}
                    </ul>
                  )}
                  {column.hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => onViewInList(column.status)}
                      className="mx-2.5 mb-2.5 inline-flex items-center justify-center gap-1 rounded-nocturne-control px-3 py-2 text-xs font-semibold text-nocturne-accent-text hover:bg-nocturne-raised focus-visible:outline-2 focus-visible:outline-nocturne-accent"
                    >
                      +{column.hiddenCount} more <ArrowRight className="size-3" aria-hidden /> view in list
                    </button>
                  )}
                </BoardColumnShell>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {active ? (
            <div className={cn(cardClass, "w-[16.25rem] cursor-grabbing shadow-nocturne-lift")}>
              <CardBody app={active} now={now} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <p className={cn(adminLabelClass, "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 normal-case")}>
        <span>Days in stage:</span>
        <span className={cn("rounded-nocturne-pill px-2 py-0.5", AGE_TONE.neutral)}>under 7</span>
        <span className={cn("rounded-nocturne-pill px-2 py-0.5", AGE_TONE.warning)}>7+</span>
        <span className={cn("rounded-nocturne-pill px-2 py-0.5", AGE_TONE.danger)}>14+</span>
      </p>

      <RejectReasonDialog picker={board.rejectPicker} candidateName={board.rejectTarget?.candidateName ?? "this candidate"} />
    </div>
  );
}
