"use client";

import { useState } from "react";
import { KanbanSquare, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ApplicationStatus } from "@/lib/recruitment/constants";
import { useApplicationsViewMode, type ApplicationsViewMode } from "@/hooks/recruitment/useApplicationsViewMode";
import { AdminPageHeading } from "@/components/nocturne/recruitment/AdminShellNocturne";
import { AdminApplicationsListNocturne } from "@/components/nocturne/recruitment/AdminApplicationsListNocturne";
import { AdminApplicationsBoardNocturne } from "@/components/nocturne/recruitment/AdminApplicationsBoardNocturne";
import type { ApplicationSummary } from "@/types/recruitment";

const MODES: { value: ApplicationsViewMode; label: string; icon: typeof List }[] = [
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: KanbanSquare },
];

function ViewToggle({ mode, onChange }: { mode: ApplicationsViewMode; onChange: (mode: ApplicationsViewMode) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="View"
      className="inline-flex gap-1 rounded-nocturne-control border border-nocturne-border-strong bg-nocturne-bg p-1"
    >
      {MODES.map(({ value, label, icon: Icon }) => {
        const on = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3.5 text-[0.8125rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-nocturne-accent motion-reduce:transition-none",
              on
                ? "bg-nocturne-surface-2 text-nocturne-ink shadow-nocturne-rest"
                : "text-nocturne-ink-muted hover:text-nocturne-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Applications for one job, as a list or a Kanban board (remembered per browser). */
export function AdminApplicationsViewNocturne({
  jobTitle,
  applications,
  now,
}: {
  jobTitle: string;
  applications: ApplicationSummary[];
  now: number;
}) {
  const { mode, setMode } = useApplicationsViewMode();
  const [listStatus, setListStatus] = useState("all");

  return (
    <div>
      <AdminPageHeading
        eyebrow="Recruitment · Applications"
        title={jobTitle}
        lead={
          <>
            <span className="nocturne-mono font-semibold text-nocturne-ink">{applications.length}</span> application
            {applications.length === 1 ? "" : "s"}
          </>
        }
        action={<ViewToggle mode={mode} onChange={setMode} />}
      />

      {mode === "board" ? (
        <AdminApplicationsBoardNocturne
          applications={applications}
          now={now}
          onViewInList={(status: ApplicationStatus) => {
            setListStatus(status);
            setMode("list");
          }}
        />
      ) : (
        <AdminApplicationsListNocturne key={listStatus} applications={applications} initialStatusFilter={listStatus} />
      )}
    </div>
  );
}
