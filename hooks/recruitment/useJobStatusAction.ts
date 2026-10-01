"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@/lib/recruitment/constants";

/** Shared by the jobs list's quick actions and the job detail page's
 *  Publish/Unpublish/Close buttons — hits the status-only endpoint so a
 *  quick status change never risks overwriting the rest of the job. */
export function useJobStatusAction() {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(jobId: string, status: JobStatus) {
    setPendingId(jobId);
    setError(null);
    const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPendingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't update job status.");
      return;
    }
    router.refresh();
  }

  return { changeStatus, pendingId, error };
}
