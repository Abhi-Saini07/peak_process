"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applicationStatusLabel, educationLabel } from "@/lib/recruitment/constants";
import { availableNextStatuses, useApplicationStatusActions } from "@/hooks/recruitment/useApplicationStatusActions";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { formatBytes } from "@/lib/utils/formatBytes";
import {
  AdminPageHeading,
  StatusPill,
  adminPanelClass,
} from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { ApplicationDetail } from "@/types/recruitment";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function InfoRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold tracking-[0.04em] text-nocturne-ink-muted">{label}</dt>
      <dd className={cn("mt-1 text-sm break-words text-nocturne-ink", mono && "nocturne-mono text-[0.8125rem]")}>{value}</dd>
    </div>
  );
}

function PanelTitle({ children }: { children: string }) {
  return <h2 className="font-nocturne-display text-[1.1875rem] font-semibold text-nocturne-ink">{children}</h2>;
}

export function AdminApplicationDetailNocturne({ application }: { application: ApplicationDetail }) {
  const { setStatus, isUpdating, error } = useApplicationStatusActions(application.id);
  const nextStatuses = availableNextStatuses(application.status);

  return (
    <div>
      <Link
        href={`/admin/jobs/${application.jobId}/applications`}
        className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-sm text-[0.8125rem] font-semibold text-nocturne-ink-muted transition-colors hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{application.jobTitle}</span>
      </Link>

      <AdminPageHeading
        title={application.candidateName}
        lead={
          <>
            {application.jobTitle} · Reference{" "}
            <span className="nocturne-mono text-[0.875rem] text-nocturne-ink">{application.reference}</span>
          </>
        }
      />

      <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={cn(adminPanelClass, "px-4 py-5 sm:px-6")}>
            <PanelTitle>Candidate information</PanelTitle>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoRow label="Email" value={application.email} />
              <InfoRow label="Phone" value={application.phone} mono />
              <InfoRow label="Location" value={application.location} />
              <InfoRow
                label="Experience"
                value={application.experienceYears != null ? `${application.experienceYears} years` : null}
              />
              <InfoRow label="Education" value={application.education ? educationLabel(application.education) : null} />
              <InfoRow label="Applied" value={formatDateTime(application.appliedAt)} mono />
            </dl>
          </section>

          <section className={cn(adminPanelClass, "overflow-hidden")}>
            <div className="border-b border-nocturne-border px-4 py-4 sm:px-6">
              <PanelTitle>Documents</PanelTitle>
            </div>
            {application.documents.length === 0 ? (
              <p className="px-4 py-5 text-sm text-nocturne-ink-muted sm:px-6">No documents on file.</p>
            ) : (
              <ul>
                {application.documents.map((doc) => (
                  <li key={doc.id} className="border-b border-nocturne-border last:border-b-0">
                    <a
                      href={`/api/admin/applications/${application.id}/documents/${doc.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-nocturne-table-head focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-nocturne-accent sm:px-6"
                    >
                      <FileText className="size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-nocturne-ink">
                          {doc.documentType === "resume" ? "Resume" : "Additional document"}
                        </span>
                        <span className="block truncate text-xs text-nocturne-ink-muted">{doc.fileName}</span>
                      </span>
                      <span className="nocturne-mono shrink-0 text-xs text-nocturne-ink-muted">{formatBytes(doc.fileSize)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(application.coverLetter || application.linkedinUrl || application.portfolioUrl) && (
            <section className={cn(adminPanelClass, "px-4 py-5 sm:px-6")}>
              <PanelTitle>Additional information</PanelTitle>
              <div className="mt-4 flex flex-col gap-4">
                {application.coverLetter && (
                  <div>
                    <p className="text-xs font-bold tracking-[0.04em] text-nocturne-ink-muted">Cover letter</p>
                    <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-nocturne-ink">
                      {application.coverLetter}
                    </p>
                  </div>
                )}
                {(application.linkedinUrl || application.portfolioUrl) && (
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {application.linkedinUrl && (
                      <Link
                        href={application.linkedinUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-nocturne-accent-text hover:underline"
                      >
                        LinkedIn profile <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    )}
                    {application.portfolioUrl && (
                      <Link
                        href={application.portfolioUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-nocturne-accent-text hover:underline"
                      >
                        Portfolio / Website <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-3.5 lg:sticky lg:top-6">
          <section className="flex flex-col gap-3.5 rounded-nocturne-card bg-nocturne-surface px-5 py-5.5 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <PanelTitle>Status</PanelTitle>
              <StatusPill kind="application" status={application.status}>
                {applicationStatusLabel(application.status)}
              </StatusPill>
            </div>
            {nextStatuses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setStatus(status)}
                    className={nocturneButtonVariants({
                      variant: status === "rejected" ? "secondary" : "primary",
                      size: "sm",
                    })}
                  >
                    {status === "rejected" ? "Reject" : `Move to ${applicationStatusLabel(status)}`}
                  </button>
                ))}
              </div>
            ) : null}
            {error && (
              <p className="text-sm text-nocturne-error" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className={cn(adminPanelClass, "px-5 py-5 sm:px-6")}>
            <PanelTitle>Status history</PanelTitle>
            <ol className="mt-3 flex flex-col">
              {application.history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-0.5 border-b border-nocturne-border py-2.5 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="text-nocturne-ink">
                    {entry.oldStatus ? `${applicationStatusLabel(entry.oldStatus)} → ` : ""}
                    <span className="font-bold">{applicationStatusLabel(entry.newStatus)}</span>
                    {entry.changedByName && <span className="text-nocturne-ink-muted"> · by {entry.changedByName}</span>}
                  </span>
                  <span className="nocturne-mono text-xs text-nocturne-ink-muted">{formatDateTime(entry.changedAt)}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
