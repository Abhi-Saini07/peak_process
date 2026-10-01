"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { employmentTypeLabel, jobStatusLabel, workModeLabel } from "@/lib/recruitment/constants";
import { useJobStatusAction } from "@/hooks/recruitment/useJobStatusAction";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import {
  AdminPageHeading,
  KbdHint,
  StatusPill,
  TeamPill,
  adminEyebrowClass,
  adminLabelClass,
  adminPanelClass,
  adminSearchInputClass,
} from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { JobSummary } from "@/types/recruitment";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** yyyy-mm-dd → "31 Oct 2026" without a timezone shift. */
function formatDeadline(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function todayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function experienceRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}–${max} Years`;
  if (min != null) return `${min}+ Years`;
  return `Up to ${max} Years`;
}

type StatusFilter = "all" | "published" | "draft" | "closed";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "closed", label: "Closed" },
];

function Kpi({ label, value, note, dot }: { label: string; value: number; note: string; dot?: string }) {
  return (
    <div className={cn(adminPanelClass, "flex flex-col px-4.5 py-4 sm:px-5 sm:py-4.5")}>
      <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-nocturne-ink-muted">
        {dot && <span className={cn("size-2 shrink-0 rounded-full", dot)} aria-hidden />}
        {label}
      </p>
      <p className="mt-2 font-nocturne-display text-[2.25rem] leading-none font-semibold tracking-[-0.03em] text-nocturne-ink tabular-nums sm:text-[2.5rem]">
        {value}
      </p>
      <p className="mt-2 text-xs leading-snug text-nocturne-ink-muted">{note}</p>
    </div>
  );
}

const ROW_GRID =
  "xl:grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_auto]";

export function AdminJobsListNocturne({ jobs }: { jobs: JobSummary[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const { changeStatus, pendingId, error } = useJobStatusAction();

  // "/" jumps to the search box, unless already typing somewhere.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const today = todayYmd();
    const c = { all: jobs.length, published: 0, draft: 0, closed: 0, live: 0, applicants: 0 };
    for (const j of jobs) {
      c[j.status] += 1;
      c.applicants += j.applicationCount;
      if (j.status === "published" && (!j.deadline || j.deadline >= today)) c.live += 1;
    }
    return c;
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (statusFilter === "all" || j.status === statusFilter) &&
        (!q ||
          j.title.toLowerCase().includes(q) ||
          (j.department ?? "").toLowerCase().includes(q) ||
          (j.location ?? "").toLowerCase().includes(q)),
    );
  }, [jobs, query, statusFilter]);

  return (
    <div>
      <AdminPageHeading
        eyebrow="Recruitment"
        title="Job postings"
        lead="Everything that’s live on the careers site, plus drafts in progress."
        action={
          <Link href="/admin/jobs/new" className={nocturneButtonVariants({ variant: "primary" })}>
            <Plus className="size-4" aria-hidden /> Post a job
          </Link>
        }
      />

      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi
          label="Published"
          dot="bg-nocturne-success"
          value={counts.published}
          note={counts.live === counts.published ? "On the careers site" : `${counts.live} live on the careers site`}
        />
        <Kpi label="Drafts" dot="bg-nocturne-gold" value={counts.draft} note="Only visible to HR" />
        <Kpi label="Closed" dot="bg-nocturne-ink-faint" value={counts.closed} note="No longer taking applications" />
        <Kpi label="Applicants" value={counts.applicants} note="Across all postings" />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Filter by status"
          className="-mx-1 flex max-w-full gap-2 self-start overflow-x-auto px-1 py-1 text-[0.8125rem] font-semibold"
        >
          {FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-nocturne-pill px-3.5 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent",
                  active
                    ? "bg-nocturne-accent text-nocturne-on-accent"
                    : "border border-nocturne-border-strong/70 text-nocturne-ink-muted hover:border-nocturne-border-strong hover:bg-nocturne-raised hover:text-nocturne-ink",
                )}
              >
                {f.label}
                <span className="nocturne-mono text-xs font-medium tabular-nums">{counts[f.value]}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-nocturne-ink-faint"
            aria-hidden
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search postings"
            aria-label="Search postings"
            aria-keyshortcuts="/"
            className={adminSearchInputClass}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2">
            <KbdHint>/</KbdHint>
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-nocturne-error" role="alert">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className={cn(adminPanelClass, "mt-4 px-6 py-14 text-center")}>
          <p className="font-nocturne-display text-xl font-semibold tracking-[-0.01em] text-nocturne-ink">
            {jobs.length === 0 ? "No job postings yet" : "Nothing matches"}
          </p>
          <p className="mt-1.5 text-sm text-nocturne-ink-muted">
            {jobs.length === 0 ? "No job openings yet — create your first one." : "No jobs match your search."}
          </p>
        </div>
      ) : (
        // One card-surface table on wide screens; below `xl` (the sidebar eats width on tablets) each row is its own card.
        <div className="mt-4 xl:overflow-hidden xl:rounded-nocturne-card xl:border xl:border-nocturne-border xl:bg-nocturne-card xl:shadow-nocturne-rest">
          <div
            className={cn(
              "hidden items-center gap-4 border-b border-nocturne-border bg-nocturne-table-head px-5 py-3 xl:grid",
              adminLabelClass,
              ROW_GRID,
            )}
            aria-hidden
          >
            <span>Role</span>
            <span>Team</span>
            <span>Status</span>
            <span>Applicants</span>
            <span>Deadline</span>
            <span className="w-52" />
          </div>

          <ul className="flex flex-col gap-3 xl:gap-0">
            {filtered.map((job) => {
              const sub = [
                job.location,
                employmentTypeLabel(job.employmentType),
                workModeLabel(job.workMode),
                experienceRange(job.experienceMinYears, job.experienceMaxYears),
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li
                  key={job.id}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-4 py-4 shadow-nocturne-rest transition-colors sm:px-5",
                    "xl:gap-y-2.5 xl:rounded-none xl:border-0 xl:border-b xl:py-3.5 xl:shadow-none xl:last:border-b-0 xl:hover:bg-nocturne-raised",
                    ROW_GRID,
                  )}
                >
                  <div className="min-w-0">
                    {job.department && <p className={cn(adminEyebrowClass, "mb-1.5 truncate xl:hidden")}>{job.department}</p>}
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="rounded-sm font-nocturne-display text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] text-nocturne-ink hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent xl:font-nocturne-ui xl:text-[0.9375rem] xl:font-bold xl:tracking-normal"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-[0.8125rem] text-nocturne-ink-muted">{sub}</p>
                  </div>

                  <div className="hidden min-w-0 xl:block">
                    {job.department ? <TeamPill>{job.department}</TeamPill> : <span className="text-nocturne-ink-faint">—</span>}
                  </div>

                  <div className="self-start justify-self-end xl:self-center xl:justify-self-start">
                    <StatusPill kind="job" status={job.status}>
                      {jobStatusLabel(job.status)}
                    </StatusPill>
                  </div>

                  {/* Mobile: applicants and deadline share one meta line. */}
                  <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.8125rem] text-nocturne-ink-muted xl:contents">
                    <span className="flex items-center gap-1.5 text-nocturne-ink xl:block">
                      <Users className="size-3.5 text-nocturne-ink-faint xl:hidden" aria-hidden />
                      <span className="nocturne-mono text-[0.8125rem] font-medium">{job.applicationCount}</span>
                      <span className="text-nocturne-ink-muted xl:hidden">
                        applicant{job.applicationCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="min-w-0 xl:block">
                      <span className="nocturne-mono block text-[0.8125rem] whitespace-nowrap text-nocturne-ink">
                        <span className="font-nocturne-ui text-nocturne-ink-muted xl:hidden">Deadline </span>
                        {job.deadline ? formatDeadline(job.deadline) : "—"}
                      </span>
                      <span className="nocturne-mono hidden text-xs whitespace-nowrap text-nocturne-ink-faint xl:block">
                        Created {formatDate(job.createdAt)}
                      </span>
                    </span>
                  </div>

                  <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-nocturne-border pt-3 xl:col-span-1 xl:w-52 xl:flex-nowrap xl:justify-end xl:border-0 xl:pt-0">
                    {job.status === "draft" && (
                      <button
                        type="button"
                        disabled={pendingId === job.id}
                        onClick={() => changeStatus(job.id, "published")}
                        className={cn(nocturneButtonVariants({ variant: "ghost" }), "h-auto px-0.5 text-[0.8125rem]")}
                      >
                        Publish
                      </button>
                    )}
                    {job.status !== "draft" && (
                      <Link
                        href={`/admin/jobs/${job.id}/applications`}
                        className={cn(nocturneButtonVariants({ variant: "ghost" }), "h-auto px-0.5 text-[0.8125rem]")}
                      >
                        Applications
                      </Link>
                    )}
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      aria-label={`Edit ${job.title}`}
                      className={nocturneButtonVariants({
                        variant: "secondary",
                        size: "sm",
                        className: "ml-auto h-8.5 px-3 xl:ml-0",
                      })}
                    >
                      <Pencil className="size-3.5" aria-hidden /> Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
