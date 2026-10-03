"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { groupByDay } from "@/lib/recruitment/interviews";
import type { InterviewRow, ScheduleInviteRow } from "@/lib/server/interviewRepository";
import { useInterviewRowActions, useManualInterviewForm } from "@/hooks/recruitment/useInterviewActions";
import {
  InterviewItem,
  InviteItem,
  ManualInterviewDialog,
  type InterviewerOption,
} from "@/components/nocturne/recruitment/ApplicationInterviewsNocturne";
import type { InterviewRow as Row } from "@/lib/server/interviewRepository";
import { AdminPageHeading, adminCardTitleClass, adminPanelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";

/** /admin/interviews: upcoming interviews by office day, then links still waiting on candidates. */
export function AdminInterviewsNocturne({
  interviews,
  invites,
  timeZone,
  now,
  interviewers,
}: {
  interviews: InterviewRow[];
  invites: ScheduleInviteRow[];
  timeZone: string;
  now: number;
  interviewers: InterviewerOption[];
}) {
  const actions = useInterviewRowActions();
  const edit = useManualInterviewForm("", interviewers[0]?.id ?? "");
  const [editingName, setEditingName] = useState("");
  const startEdit = (row: Row) => {
    setEditingName(row.candidateName);
    edit.openForEdit(row);
  };
  const days = groupByDay(interviews, timeZone, now);
  return (
    <div>
      <AdminPageHeading
        eyebrow="Recruitment · Interviews"
        title="Interviews"
        lead={`Upcoming interviews and scheduling links. Times in office time (${timeZone}).`}
      />
      {actions.error && (
        <p role="alert" className="mt-4 text-sm text-nocturne-error">
          {actions.error}
        </p>
      )}
      <div className="mt-7 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className={cn(adminPanelClass, "flex flex-col gap-5 px-4 py-5.5 sm:px-6")} aria-label="Upcoming interviews">
          <h2 className={adminCardTitleClass}>Upcoming · {interviews.length}</h2>
          {days.length === 0 && (
            <p className="rounded-nocturne-control border border-dashed border-nocturne-border px-4 py-8 text-center text-sm text-nocturne-ink-muted">
              No interviews booked. Schedule one from an application, or send a scheduling link.
            </p>
          )}
          {days.map((day) => (
            <div key={day.key} className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-nocturne-ink">{day.label}</h3>
              <ul className="flex flex-col gap-2">
                {day.items.map((i) => (
                  <InterviewItem key={i.id} interview={i} timeZone={timeZone} actions={actions} now={now} showCandidate onEdit={startEdit} />
                ))}
              </ul>
            </div>
          ))}
        </section>
        <section className={cn(adminPanelClass, "flex flex-col gap-4 px-4 py-5.5 sm:px-6")} aria-label="Waiting on candidates">
          <h2 className={adminCardTitleClass}>Waiting on candidates · {invites.length}</h2>
          {invites.length === 0 ? (
            <p className="text-sm text-nocturne-ink-muted">No open scheduling links.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {invites.map((i) => (
                <InviteItem key={i.id} invite={i} timeZone={timeZone} actions={actions} showCandidate />
              ))}
            </ul>
          )}
        </section>
      </div>
      <ManualInterviewDialog form={edit} interviewers={interviewers} candidateName={editingName} />
    </div>
  );
}
