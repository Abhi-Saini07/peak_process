"use client";

import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, FileText, Flag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applicationStatusLabel, educationLabel } from "@/lib/recruitment/constants";
import { availableNextStatuses, useApplicationStatusActions } from "@/hooks/recruitment/useApplicationStatusActions";
import { useRejectReasonPicker } from "@/hooks/recruitment/useRejectReasonPicker";
import { rejectReasonLabel } from "@/lib/recruitment/rejection";
import { useApplicationActivity } from "@/hooks/recruitment/useApplicationActivity";
import { ApplicationActivityNocturne } from "@/components/nocturne/recruitment/ApplicationActivityNocturne";
import { isQualifyingAnswer } from "@/lib/recruitment/knockouts";
import { RejectReasonDialog } from "@/components/nocturne/recruitment/RejectReasonDialog";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { formatBytes } from "@/lib/utils/formatBytes";
import {
  AdminPageHeading,
  ScreeningFlagBadge,
  StatusPill,
  adminCardTitleClass,
  adminLabelClass,
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
      <dt className={adminLabelClass}>{label}</dt>
      <dd className={cn("mt-1.5 text-sm font-medium break-words text-nocturne-ink", mono && "nocturne-mono text-[0.8125rem]")}>
        {value}
      </dd>
    </div>
  );
}

function PanelTitle({ children }: { children: string }) {
  return <h2 className={adminCardTitleClass}>{children}</h2>;
}

export function AdminApplicationDetailNocturne({ application }: { application: ApplicationDetail }) {
  const { setStatus, isUpdating, error, clearError } = useApplicationStatusActions(application.id);
  const nextStatuses = availableNextStatuses(application.status);
  const activity = useApplicationActivity(application);
  const rejectPicker = useRejectReasonPicker((input) => setStatus("rejected", input));

  return (
    <div>
      <Link
        href={`/admin/jobs/${application.jobId}/applications`}
        className="mb-4 inline-flex h-8 max-w-full items-center gap-1.5 rounded-nocturne-pill border border-nocturne-border bg-nocturne-card pr-3.5 pl-2.5 text-[0.8125rem] font-semibold text-nocturne-ink-muted shadow-nocturne-rest transition-colors hover:border-nocturne-border-strong hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
      >
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{application.jobTitle}</span>
      </Link>

      <AdminPageHeading
        eyebrow="Recruitment · Application"
        title={application.candidateName}
        action={application.knockoutFlagged ? <ScreeningFlagBadge /> : undefined}
        lead={
          <>
            {application.jobTitle} · Reference{" "}
            <span className="nocturne-mono text-[0.875rem] text-nocturne-ink">{application.reference}</span>
          </>
        }
      />

      <div className="mt-7 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className={cn(adminPanelClass, "px-4 py-5.5 sm:px-6.5")}>
            <PanelTitle>Candidate information</PanelTitle>
            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
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

          {application.knockoutAnswers.length > 0 && (
            <section className={cn(adminPanelClass, "px-4 py-5.5 sm:px-6.5")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PanelTitle>Screening answers</PanelTitle>
                {application.knockoutFlagged && <ScreeningFlagBadge />}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {application.knockoutAnswers.map((item) => {
                  const ok = isQualifyingAnswer(item);
                  const yesNo = (v: boolean) => (v ? "Yes" : "No");
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-nocturne-control border border-nocturne-border px-3.5 py-3"
                    >
                      <span
                        className={cn(
                          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                          ok ? "bg-nocturne-success-tint text-nocturne-success" : "bg-nocturne-gold-tint text-nocturne-gold",
                        )}
                        aria-hidden
                      >
                        {ok ? <Check className="size-3.5" /> : <Flag className="size-3" />}
                      </span>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold break-words text-nocturne-ink">{item.label}</p>
                        <p className="mt-0.5 text-nocturne-ink-muted">
                          Answered{" "}
                          <span className="font-semibold text-nocturne-ink">
                            {item.answer == null ? "nothing" : yesNo(item.answer)}
                          </span>
                          {!ok && <> · qualifying answer is {yesNo(item.qualifyingAnswer)}</>}
                          <span className="sr-only">{ok ? " (qualifies)" : " (flagged)"}</span>
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className={cn(adminPanelClass, "overflow-hidden")}>
            <div className="border-b border-nocturne-border px-4 py-4.5 sm:px-6.5">
              <PanelTitle>Documents</PanelTitle>
            </div>
            {application.documents.length === 0 ? (
              <p className="px-4 py-5 text-sm text-nocturne-ink-muted sm:px-6.5">No documents on file.</p>
            ) : (
              <ul>
                {application.documents.map((doc) => (
                  <li key={doc.id} className="border-b border-nocturne-border last:border-b-0">
                    <a
                      href={`/api/admin/applications/${application.id}/documents/${doc.id}`}
                      className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-nocturne-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-nocturne-accent sm:px-6.5"
                    >
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-nocturne-control bg-nocturne-accent-tint text-nocturne-accent-text">
                        <FileText className="size-4" aria-hidden />
                      </span>
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
            <section className={cn(adminPanelClass, "px-4 py-5.5 sm:px-6.5")}>
              <PanelTitle>Additional information</PanelTitle>
              <div className="mt-4 flex flex-col gap-4">
                {application.coverLetter && (
                  <div>
                    <p className={adminLabelClass}>Cover letter</p>
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

          <ApplicationActivityNocturne activity={activity} />
        </div>

        <aside className="flex min-w-0 flex-col gap-3.5 lg:sticky lg:top-6">
          <section
            className={cn(adminPanelClass, "flex flex-col gap-4 px-5 py-5.5 sm:px-6", nextStatuses.length > 0 && "shadow-nocturne-glow")}
          >
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
                    onClick={() => {
                      if (status === "rejected") {
                        clearError();
                        rejectPicker.open();
                      } else {
                        void setStatus(status);
                      }
                    }}
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
            {application.status === "rejected" && application.rejectReason && (
              <div className="rounded-nocturne-control bg-nocturne-raised px-3.5 py-3 text-sm">
                <p className={adminLabelClass}>Reason</p>
                <p className="mt-1 font-semibold text-nocturne-ink">{rejectReasonLabel(application.rejectReason)}</p>
                {application.rejectNote && (
                  <p className="mt-1 whitespace-pre-line text-nocturne-ink-muted">{application.rejectNote}</p>
                )}
              </div>
            )}
            {error && !rejectPicker.isOpen && (
              <p className="text-sm text-nocturne-error" role="alert">
                {error}
              </p>
            )}
          </section>

        </aside>
      </div>

      <RejectReasonDialog picker={rejectPicker} candidateName={application.candidateName} serverError={error} />
    </div>
  );
}
