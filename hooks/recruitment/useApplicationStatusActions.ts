"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@/lib/recruitment/constants";
import { nextStages, GUARDED_STAGES } from "@/lib/recruitment/stages";
import type { RejectInput } from "@/lib/recruitment/rejection";

/** Which plain status buttons to show next. Comes from STAGE_TRANSITIONS,
 *  the same map the API enforces (one step forward, or "Reject"), minus the
 *  stages with their own flow ("offered" via the offer form, "selected" via
 *  "Mark as hired"), which the detail page offers separately. */
export function availableNextStatuses(current: ApplicationStatus): readonly ApplicationStatus[] {
  return nextStages(current).filter((s) => !GUARDED_STAGES[s]);
}

/** PATCH the status. Resolves to true on success, so callers (the reject
 *  dialog, the Kanban board) can close or roll back. */
export async function patchApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  reject: RejectInput | null = null,
  notifyCandidate = true,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/admin/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        reject ? { status, rejectReason: reject.reason, rejectNote: reject.note, notifyCandidate } : { status },
      ),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error ?? "Couldn't update the application status." };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
}

export function useApplicationStatusActions(applicationId: string) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(
    status: ApplicationStatus,
    reject: RejectInput | null = null,
    notifyCandidate = true,
  ): Promise<boolean> {
    setIsUpdating(true);
    setError(null);
    const result = await patchApplicationStatus(applicationId, status, reject, notifyCandidate);
    setIsUpdating(false);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  return { setStatus, isUpdating, error, clearError: () => setError(null) };
}
