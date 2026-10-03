"use client";

import Link from "next/link";
import { CalendarClock, CalendarPlus, Copy, Link2, MapPin, Phone, Video } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  DURATION_OPTIONS,
  INTERVIEW_MODE_OPTIONS,
  INTERVIEW_STATUS_LABEL,
  interviewModeLabel,
  type InterviewMode,
} from "@/lib/recruitment/interviews";
import { formatDayLabel, formatShortDateTime } from "@/lib/recruitment/timezones";
import type { InterviewRow, ScheduleInviteRow } from "@/lib/server/interviewRepository";
import {
  useInterviewRowActions,
  useManualInterviewForm,
  useScheduleInviteForm,
  type InterviewRowActions,
  type ManualInterviewForm,
  type ScheduleInviteForm,
} from "@/hooks/recruitment/useInterviewActions";
import { NocturneDialog } from "@/components/nocturne/ui/NocturneDialog";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { NocturneTextField } from "@/components/nocturne/ui/NocturneTextField";
import { NocturneSelectField } from "@/components/nocturne/ui/NocturneSelectField";
import { NocturneTextareaField } from "@/components/nocturne/ui/NocturneTextareaField";
import { NocturneCheckbox } from "@/components/nocturne/ui/NocturneCheckbox";
import { adminCardTitleClass, adminLabelClass, adminPanelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";

export type InterviewerOption = { id: string; fullName: string; email: string };

const MODE_ICON = { video: Video, phone: Phone, onsite: MapPin } as const;

const STATUS_TONE: Record<InterviewRow["status"], string> = {
  scheduled: "bg-nocturne-accent-tint text-nocturne-accent-text",
  completed: "bg-nocturne-success-tint text-nocturne-success",
  cancelled: "bg-nocturne-raised text-nocturne-ink-muted",
  no_show: "bg-nocturne-error-tint text-nocturne-error",
};

export function InterviewStatusBadge({ status }: { status: InterviewRow["status"] }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-nocturne-pill px-2.5 text-xs font-semibold whitespace-nowrap", STATUS_TONE[status])}>
      {INTERVIEW_STATUS_LABEL[status]}
    </span>
  );
}

/** One interview with its actions. Shared by the application page and /admin/interviews. */
export function InterviewItem({
  interview,
  timeZone,
  actions,
  showCandidate = false,
  now,
}: {
  interview: InterviewRow;
  timeZone: string;
  actions: InterviewRowActions;
  showCandidate?: boolean;
  now: number;
}) {
  const Icon = MODE_ICON[interview.mode as InterviewMode] ?? CalendarClock;
  const busy = actions.busyId === interview.id;
  const started = new Date(interview.scheduledAt).getTime() <= now;
  return (
    <li className="flex flex-col gap-2.5 rounded-nocturne-control border border-nocturne-border p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {showCandidate && (
            <Link href={`/admin/applications/${interview.applicationId}`} className="text-sm font-bold text-nocturne-ink hover:underline">
              {interview.candidateName}
              <span className="font-medium text-nocturne-ink-muted"> · {interview.jobTitle}</span>
            </Link>
          )}
          <p className={cn("text-sm text-nocturne-ink", showCandidate ? "mt-0.5" : "font-semibold")}>
            {formatShortDateTime(new Date(interview.scheduledAt), timeZone)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-nocturne-ink-muted">
            <Icon className="size-3.5" aria-hidden />
            {interviewModeLabel(interview.mode)} · {interview.durationMinutes} min · {interview.interviewerName}
            {interview.viaLink && " · booked via link"}
          </p>
        </div>
        <InterviewStatusBadge status={interview.status} />
      </div>
      {interview.status === "scheduled" && (interview.meetingUrl || interview.location) && (
        <p className="text-xs break-words text-nocturne-ink-muted">
          {interview.meetingUrl ? (
            <a href={interview.meetingUrl} target="_blank" rel="noreferrer" className="font-semibold text-nocturne-accent-text hover:underline">
              Join meeting
            </a>
          ) : (
            interview.location
          )}
        </p>
      )}
      {interview.notes && <p className="text-xs whitespace-pre-line text-nocturne-ink-muted">{interview.notes}</p>}
      {interview.status === "scheduled" &&
        (actions.confirmCancelId === interview.id ? (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Confirm cancellation">
            <span className="text-xs text-nocturne-ink">Cancel and email both sides?</span>
            <NocturneButton size="sm" onClick={() => void actions.setStatus(interview.id, "cancelled")} isLoading={busy}>
              Yes, cancel
            </NocturneButton>
            <NocturneButton size="sm" variant="secondary" onClick={actions.keep} disabled={busy}>
              Keep
            </NocturneButton>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {started && (
              <>
                <NocturneButton size="sm" variant="secondary" disabled={busy} onClick={() => void actions.setStatus(interview.id, "completed")}>
                  Completed
                </NocturneButton>
                <NocturneButton size="sm" variant="secondary" disabled={busy} onClick={() => void actions.setStatus(interview.id, "no_show")}>
                  No-show
                </NocturneButton>
              </>
            )}
            <NocturneButton size="sm" variant="secondary" disabled={busy} onClick={() => actions.askCancel(interview.id)}>
              Cancel
            </NocturneButton>
          </div>
        ))}
    </li>
  );
}

/** A pending self-scheduling link, with "Withdraw". */
export function InviteItem({
  invite,
  timeZone,
  actions,
  showCandidate = false,
}: {
  invite: ScheduleInviteRow;
  timeZone: string;
  actions: InterviewRowActions;
  showCandidate?: boolean;
}) {
  const day = (iso: string) => formatDayLabel(new Date(iso), timeZone, "short");
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-nocturne-control border border-dashed border-nocturne-border-strong p-3.5">
      <div className="min-w-0">
        {showCandidate && (
          <Link href={`/admin/applications/${invite.applicationId}`} className="text-sm font-bold text-nocturne-ink hover:underline">
            {invite.candidateName}
            <span className="font-medium text-nocturne-ink-muted"> · {invite.jobTitle}</span>
          </Link>
        )}
        <p className="flex items-center gap-1.5 text-sm text-nocturne-ink">
          <Link2 className="size-3.5 text-nocturne-ink-muted" aria-hidden />
          Waiting for the candidate to pick a time
        </p>
        <p className="mt-0.5 text-xs text-nocturne-ink-muted">
          {day(invite.windowStart)} – {day(new Date(new Date(invite.windowEnd).getTime() - 1).toISOString())} · {invite.durationMinutes} min ·{" "}
          {interviewModeLabel(invite.mode)} · {invite.interviewerName}
        </p>
      </div>
      <NocturneButton size="sm" variant="secondary" disabled={actions.busyId === invite.id} onClick={() => void actions.cancelInvite(invite.id)}>
        Withdraw
      </NocturneButton>
    </li>
  );
}

function SharedFields({
  form,
  interviewers,
}: {
  form: Pick<ManualInterviewForm, "values" | "set" | "errors"> | Pick<ScheduleInviteForm, "values" | "set" | "errors">;
  interviewers: InterviewerOption[];
}) {
  // Both forms share these five fields with the same keys.
  const f = form as Pick<ManualInterviewForm, "values" | "set" | "errors">;
  return (
    <>
      <NocturneSelectField
        id="interviewer"
        label="Interviewer"
        required
        value={f.values.interviewerAdminId}
        onChange={(e) => f.set("interviewerAdminId", e.target.value)}
        options={interviewers.map((i) => ({ value: i.id, label: i.fullName }))}
        error={f.errors.interviewerAdminId}
      />
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <NocturneSelectField
          id="interview-duration"
          label="Length"
          required
          value={String(f.values.durationMinutes)}
          onChange={(e) => f.set("durationMinutes", Number(e.target.value))}
          options={DURATION_OPTIONS.map((d) => ({ value: String(d), label: `${d} minutes` }))}
          error={f.errors.durationMinutes}
        />
        <NocturneSelectField
          id="interview-mode"
          label="Format"
          required
          value={f.values.mode}
          onChange={(e) => f.set("mode", e.target.value as InterviewMode)}
          options={INTERVIEW_MODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          error={f.errors.mode}
        />
      </div>
      {f.values.mode === "video" && (
        <NocturneTextField
          id="interview-url"
          label="Video call link"
          type="url"
          required
          placeholder="https://meet.google.com/…"
          value={f.values.meetingUrl}
          onChange={(e) => f.set("meetingUrl", e.target.value)}
          error={f.errors.meetingUrl}
        />
      )}
      {f.values.mode === "onsite" && (
        <NocturneTextField
          id="interview-location"
          label="Where"
          required
          value={f.values.location}
          onChange={(e) => f.set("location", e.target.value)}
          error={f.errors.location}
        />
      )}
    </>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-nocturne-error">
      {message}
    </p>
  );
}

function ManualInterviewDialog({ form, interviewers, candidateName }: { form: ManualInterviewForm; interviewers: InterviewerOption[]; candidateName: string }) {
  return (
    <NocturneDialog open={form.isOpen} onClose={form.close} eyebrow="Schedule interview" title={candidateName} className="max-w-lg">
      {() => (
        <form noValidate onSubmit={form.submit} className="flex flex-col gap-1">
          <NocturneTextField
            id="interview-when"
            label="Date and time"
            type="datetime-local"
            required
            className="nocturne-mono"
            helperText="In your own timezone."
            value={form.values.localDateTime}
            onChange={(e) => form.set("localDateTime", e.target.value)}
            error={form.errors.scheduledAt}
          />
          <SharedFields form={form} interviewers={interviewers} />
          <NocturneTextareaField
            id="interview-notes"
            label="Notes for the interviewer"
            rows={3}
            maxLength={2000}
            helperText="Internal. Not sent to the candidate."
            value={form.values.notes}
            onChange={(e) => form.set("notes", e.target.value)}
            error={form.errors.notes}
          />
          <NocturneCheckbox
            id="interview-notify-candidate"
            checked={form.values.notifyCandidate}
            onChange={(e) => form.set("notifyCandidate", e.target.checked)}
            label="Email the candidate (the interviewer is always emailed)"
          />
          <FormError message={form.errors.form} />
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <NocturneButton type="button" variant="secondary" size="sm" onClick={form.close} disabled={form.isSubmitting}>
              Cancel
            </NocturneButton>
            <NocturneButton type="submit" size="sm" isLoading={form.isSubmitting}>
              <CalendarPlus className="size-4" aria-hidden />
              Schedule
            </NocturneButton>
          </div>
        </form>
      )}
    </NocturneDialog>
  );
}

function ScheduleInviteDialog({ form, interviewers, candidateName }: { form: ScheduleInviteForm; interviewers: InterviewerOption[]; candidateName: string }) {
  return (
    <NocturneDialog open={form.isOpen} onClose={form.close} eyebrow="Send scheduling link" title={candidateName} className="max-w-lg">
      {() =>
        form.link ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-nocturne-ink">The link is on its way to the candidate. You can also copy it now; it won&apos;t be shown again.</p>
            <code className="nocturne-mono rounded-nocturne-control bg-nocturne-raised p-3 text-xs break-all text-nocturne-ink">{form.link}</code>
            <div className="flex flex-wrap justify-end gap-2">
              <NocturneButton size="sm" variant="secondary" onClick={() => void form.copyLink()}>
                <Copy className="size-4" aria-hidden />
                {form.copied ? "Copied" : "Copy link"}
              </NocturneButton>
              <NocturneButton size="sm" onClick={form.close}>
                Done
              </NocturneButton>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={form.submit} className="flex flex-col gap-1">
            <p className="mb-2 text-sm text-nocturne-ink-muted">
              The candidate picks a weekday time between 9:00 and 17:00 office time, at least 24 hours ahead, that the interviewer has free.
            </p>
            <SharedFields form={form} interviewers={interviewers} />
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <NocturneTextField
                id="invite-from"
                label="From"
                type="date"
                required
                className="nocturne-mono"
                value={form.values.windowStartDate}
                onChange={(e) => form.set("windowStartDate", e.target.value)}
                error={form.errors.windowStartDate}
              />
              <NocturneTextField
                id="invite-to"
                label="To"
                type="date"
                required
                className="nocturne-mono"
                value={form.values.windowEndDate}
                onChange={(e) => form.set("windowEndDate", e.target.value)}
                error={form.errors.windowEndDate}
              />
            </div>
            <FormError message={form.errors.form} />
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <NocturneButton type="button" variant="secondary" size="sm" onClick={form.close} disabled={form.isSubmitting}>
                Cancel
              </NocturneButton>
              <NocturneButton type="submit" size="sm" isLoading={form.isSubmitting}>
                <Link2 className="size-4" aria-hidden />
                Send link
              </NocturneButton>
            </div>
          </form>
        )
      }
    </NocturneDialog>
  );
}

/** The interviews card on the application page. */
export function ApplicationInterviewsNocturne({
  applicationId,
  candidateName,
  canSchedule,
  interviews,
  invites,
  interviewers,
  currentAdminId,
  timeZone,
  now,
}: {
  applicationId: string;
  candidateName: string;
  canSchedule: boolean;
  interviews: InterviewRow[];
  invites: ScheduleInviteRow[];
  interviewers: InterviewerOption[];
  currentAdminId: string;
  timeZone: string;
  now: number;
}) {
  const defaultInterviewer = interviewers.some((i) => i.id === currentAdminId) ? currentAdminId : (interviewers[0]?.id ?? "");
  const manual = useManualInterviewForm(applicationId, defaultInterviewer);
  const invite = useScheduleInviteForm(applicationId, defaultInterviewer);
  const actions = useInterviewRowActions();
  if (!canSchedule && interviews.length === 0) return null;

  return (
    <section className={cn(adminPanelClass, "flex flex-col gap-4 px-5 py-5.5 sm:px-6")} aria-label="Interviews">
      <h2 className={adminCardTitleClass}>Interviews</h2>
      {canSchedule && (
        <div className="flex flex-wrap gap-2">
          <NocturneButton size="sm" onClick={manual.open}>
            <CalendarPlus className="size-4" aria-hidden />
            Schedule
          </NocturneButton>
          <NocturneButton size="sm" variant="secondary" onClick={invite.open}>
            <Link2 className="size-4" aria-hidden />
            Send scheduling link
          </NocturneButton>
        </div>
      )}
      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((i) => (
            <InviteItem key={i.id} invite={i} timeZone={timeZone} actions={actions} />
          ))}
        </ul>
      )}
      {interviews.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {interviews.map((i) => (
            <InterviewItem key={i.id} interview={i} timeZone={timeZone} actions={actions} now={now} />
          ))}
        </ul>
      ) : (
        invites.length === 0 && <p className="text-sm text-nocturne-ink-muted">No interviews yet.</p>
      )}
      {actions.error && (
        <p role="alert" className="text-sm text-nocturne-error">
          {actions.error}
        </p>
      )}
      <p className={cn(adminLabelClass, "normal-case tracking-normal font-medium")}>Times in office time ({timeZone}).</p>
      <ManualInterviewDialog form={manual} interviewers={interviewers} candidateName={candidateName} />
      <ScheduleInviteDialog form={invite} interviewers={interviewers} candidateName={candidateName} />
    </section>
  );
}
