"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { jobStatusLabel } from "@/lib/recruitment/constants";
import { useJobStatusAction } from "@/hooks/recruitment/useJobStatusAction";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { JobFormNocturne } from "@/components/nocturne/recruitment/AdminJobFormNocturne";
import { StatusPill, adminEyebrowClass, adminPanelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { JobDetail } from "@/types/recruitment";

export function AdminJobDetailNocturne({ job }: { job: JobDetail }) {
  const { changeStatus, pendingId, error } = useJobStatusAction();
  const busy = pendingId === job.id;
  const quick = nocturneButtonVariants({ variant: "secondary", size: "sm" });

  // Status card at the top of the form's right column: current state, applicant
  // count and the quick status actions (status-only endpoint, as before).
  const statusCard = (
    <section
      className={cn(adminPanelClass, "flex flex-col gap-4 px-5 py-5.5 shadow-nocturne-glow sm:px-6")}
      aria-label="Posting status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={adminEyebrowClass}>Posting status</p>
          <StatusPill kind="job" status={job.status} className="mt-2.5">
            {jobStatusLabel(job.status)}
          </StatusPill>
        </div>
        <p className="text-right text-[0.8125rem] text-nocturne-ink-muted">
          <span className="block font-nocturne-display text-[2rem] leading-none font-semibold tracking-[-0.03em] text-nocturne-ink tabular-nums">
            {job.applicationCount}
          </span>
          <span className="mt-1 block">
            application{job.applicationCount === 1 ? "" : "s"}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {job.status === "draft" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => changeStatus(job.id, "published")}
            className={nocturneButtonVariants({ variant: "primary", size: "sm" })}
          >
            Publish
          </button>
        )}
        {job.status === "published" && (
          <>
            <button type="button" disabled={busy} onClick={() => changeStatus(job.id, "draft")} className={quick}>
              Unpublish
            </button>
            <button type="button" disabled={busy} onClick={() => changeStatus(job.id, "closed")} className={quick}>
              Close Job
            </button>
          </>
        )}
        {job.status === "closed" && (
          <button type="button" disabled={busy} onClick={() => changeStatus(job.id, "published")} className={quick}>
            Reopen
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-nocturne-error" role="alert">
          {error}
        </p>
      )}

      <div className="border-t border-nocturne-border pt-3.5">
        <Link
          href={`/admin/jobs/${job.id}/applications`}
          className="group inline-flex items-center gap-1.5 rounded-sm text-sm font-bold text-nocturne-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
        >
          View Applications
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
      </div>
    </section>
  );

  return (
    <JobFormNocturne
      key={job.updatedAt}
      mode="edit"
      jobId={job.id}
      initialJob={job}
      title={job.title}
      lead="Update the role details, then save your changes."
      aside={statusCard}
    />
  );
}
