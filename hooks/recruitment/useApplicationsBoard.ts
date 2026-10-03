"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@/lib/recruitment/constants";
import { canMoveDirectly } from "@/lib/recruitment/stages";
import { BOARD_COLUMNS, groupIntoColumns } from "@/lib/recruitment/board";
import type { RejectInput } from "@/lib/recruitment/rejection";
import { applicationStatusLabel } from "@/lib/recruitment/constants";
import { patchApplicationStatus } from "@/hooks/recruitment/useApplicationStatusActions";
import { useRejectReasonPicker } from "@/hooks/recruitment/useRejectReasonPicker";
import type { ApplicationSummary } from "@/types/recruitment";

type Override = { status: ApplicationStatus; stageEnteredAt: string };

/**
 * Board state: server data plus optimistic moves layered on top. A move shows
 * at once, then PATCHes the status; on failure the card goes back and an
 * error is shown. Dropping on "Rejected" first asks for a reason.
 */
export function useApplicationsBoard(applications: readonly ApplicationSummary[]) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<ApplicationSummary | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<ApplicationStatus>>(
    () => new Set(BOARD_COLUMNS.filter((c) => !c.collapsedByDefault).map((c) => c.status)),
  );

  // Fresh server data (router.refresh) replaces settled optimistic moves;
  // only moves still in flight keep overriding it.
  const [seenApplications, setSeenApplications] = useState(applications);
  if (seenApplications !== applications) {
    setSeenApplications(applications);
    setOverrides((current) => Object.fromEntries(Object.entries(current).filter(([id]) => pendingIds.has(id))));
  }

  const items = useMemo(
    () => applications.map((app) => (overrides[app.id] ? { ...app, ...overrides[app.id] } : app)),
    [applications, overrides],
  );
  const columns = useMemo(() => groupIntoColumns(items), [items]);

  function setPending(id: string, on: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function commitMove(app: ApplicationSummary, to: ApplicationStatus, reject: RejectInput | null): Promise<boolean> {
    setError(null);
    setOverrides((current) => ({ ...current, [app.id]: { status: to, stageEnteredAt: new Date().toISOString() } }));
    setPending(app.id, true);
    const result = await patchApplicationStatus(app.id, to, reject);
    setPending(app.id, false);
    if (!result.ok) {
      setOverrides((current) => {
        const next = { ...current };
        delete next[app.id];
        return next;
      });
      setError(`Couldn't move ${app.candidateName} to ${applicationStatusLabel(to)}: ${result.error}`);
      return false;
    }
    router.refresh();
    return true;
  }

  const rejectPicker = useRejectReasonPicker(async (input) => {
    if (!rejectTarget) return true;
    // The dialog closes either way; a failure shows on the board.
    await commitMove(rejectTarget, "rejected", input);
    return true;
  });

  /** Called on drop. Ignores drops the stage rules don't allow. */
  function moveCard(id: string, to: ApplicationStatus) {
    const app = items.find((item) => item.id === id);
    if (!app || pendingIds.has(id) || !canMoveDirectly(app.status, to)) return;
    if (to === "rejected") {
      setRejectTarget(app);
      rejectPicker.open();
      return;
    }
    void commitMove(app, to, null);
  }

  return {
    items,
    columns,
    moveCard,
    pendingIds,
    error,
    dismissError: () => setError(null),
    rejectPicker,
    rejectTarget,
    isExpanded: (status: ApplicationStatus) => expanded.has(status),
    toggleExpanded: (status: ApplicationStatus) =>
      setExpanded((current) => {
        const next = new Set(current);
        if (next.has(status)) next.delete(status);
        else next.add(status);
        return next;
      }),
  };
}
