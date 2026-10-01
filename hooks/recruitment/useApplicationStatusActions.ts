"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TERMINAL_APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/recruitment/constants";

const PIPELINE_ORDER: ApplicationStatus[] = ["applied", "under_review", "shortlisted", "interview", "selected"];

/** Which status buttons make sense to show next — every pipeline stage
 *  ahead of the current one, plus "Reject" from any non-terminal state.
 *  Never lets HR move an application backwards or act on a terminal one. */
export function availableNextStatuses(current: ApplicationStatus): ApplicationStatus[] {
  if (TERMINAL_APPLICATION_STATUSES.includes(current)) return [];
  const currentIndex = PIPELINE_ORDER.indexOf(current);
  const forward = PIPELINE_ORDER.slice(currentIndex + 1);
  return [...forward, "rejected"];
}

export function useApplicationStatusActions(applicationId: string) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: ApplicationStatus) {
    setIsUpdating(true);
    setError(null);
    const res = await fetch(`/api/admin/applications/${applicationId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setIsUpdating(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't update the application status.");
      return;
    }
    router.refresh();
  }

  return { setStatus, isUpdating, error };
}
