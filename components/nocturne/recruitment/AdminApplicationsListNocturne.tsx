"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applicationStatusLabel, APPLICATION_STATUS_OPTIONS } from "@/lib/recruitment/constants";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import {
  KbdHint,
  ScreeningFlagBadge,
  StatusPill,
  adminLabelClass,
  adminPanelClass,
  adminSearchInputClass,
} from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { ApplicationSummary } from "@/types/recruitment";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Shared look for the toolbar's search, select and sort controls. */
const controlClass =
  "h-10 rounded-nocturne-control border border-nocturne-border-strong bg-nocturne-card text-sm text-nocturne-ink outline-none transition-[border-color,box-shadow,background-color] hover:border-nocturne-ink-muted focus-visible:border-nocturne-accent focus-visible:shadow-nocturne-glow";

const GRID = "xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_auto]";

/** List view of one job's applications (toolbar + table). The page heading
 *  and the List | Board switch live in AdminApplicationsViewNocturne. */
export function AdminApplicationsListNocturne({
  applications,
  initialStatusFilter = "all",
}: {
  applications: ApplicationSummary[];
  initialStatusFilter?: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [flagFilter, setFlagFilter] = useState<"all" | "flagged" | "clear">("all");
  const [newestFirst, setNewestFirst] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = applications.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (flagFilter === "all" || (flagFilter === "flagged") === a.knockoutFlagged) &&
        (q === "" || a.candidateName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)),
    );
    list = [...list].sort((a, b) =>
      newestFirst ? b.appliedAt.localeCompare(a.appliedAt) : a.appliedAt.localeCompare(b.appliedAt),
    );
    return list;
  }, [applications, query, statusFilter, flagFilter, newestFirst]);

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
            placeholder="Search candidates…"
            aria-label="Search candidates"
            aria-keyshortcuts="/"
            className={adminSearchInputClass}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2">
            <KbdHint>/</KbdHint>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:ml-auto sm:flex">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className={cn(controlClass, "w-full appearance-none pr-9 pl-3 font-semibold")}
            >
              <option value="all">All Statuses</option>
              {APPLICATION_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-nocturne-ink-faint"
              aria-hidden
            />
          </div>
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value as typeof flagFilter)}
              aria-label="Filter by screening flag"
              className={cn(controlClass, "w-full appearance-none pr-9 pl-3 font-semibold")}
            >
              <option value="all">All screening</option>
              <option value="flagged">Flagged</option>
              <option value="clear">Not flagged</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-nocturne-ink-faint"
              aria-hidden
            />
          </div>
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className={cn(
              controlClass,
              "col-span-2 flex shrink-0 items-center justify-center gap-1.5 px-3.5 font-semibold hover:bg-nocturne-raised sm:justify-start",
            )}
          >
            <ArrowUpDown className="size-3.5 text-nocturne-ink-faint" aria-hidden />
            {newestFirst ? "Newest first" : "Oldest first"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={cn(adminPanelClass, "mt-4 px-6 py-14 text-center")}>
          <p className="font-nocturne-display text-xl font-semibold tracking-[-0.01em] text-nocturne-ink">
            {applications.length === 0 ? "No applications yet" : "Nothing matches"}
          </p>
          <p className="mt-1.5 text-sm text-nocturne-ink-muted">
            {applications.length === 0 ? "No one has applied yet." : "No applications match your filters."}
          </p>
        </div>
      ) : (
        // One card-surface table on wide screens; each application is its own card below `xl`.
        <div className="mt-4 xl:overflow-hidden xl:rounded-nocturne-card xl:border xl:border-nocturne-border xl:bg-nocturne-card xl:shadow-nocturne-rest">
          <div
            className={cn(
              "hidden items-center gap-4 border-b border-nocturne-border bg-nocturne-table-head px-5 py-3 xl:grid",
              adminLabelClass,
              GRID,
            )}
            aria-hidden
          >
            <span>Candidate</span>
            <span>Experience</span>
            <span>Applied</span>
            <span>Status</span>
            <span className="w-36" />
          </div>
          <ul className="flex flex-col gap-3 xl:gap-0">
            {filtered.map((app) => (
              <li
                key={app.id}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-4 py-4 shadow-nocturne-rest transition-colors sm:px-5",
                  "xl:gap-y-2 xl:rounded-none xl:border-0 xl:border-b xl:py-3.5 xl:shadow-none xl:last:border-b-0 xl:hover:bg-nocturne-raised",
                  GRID,
                )}
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="rounded-sm text-[0.9375rem] font-bold text-nocturne-ink hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
                  >
                    {app.candidateName}
                  </Link>
                  <p className="mt-0.5 truncate text-[0.8125rem] text-nocturne-ink-muted">{app.email}</p>
                </div>

                {/* Mobile: experience + applied date share one line under the name. */}
                <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] text-nocturne-ink-muted xl:contents">
                  <span>
                    {app.experienceYears != null ? (
                      <>
                        <span className="nocturne-mono font-medium text-nocturne-ink">{app.experienceYears}</span> years experience
                      </>
                    ) : (
                      <span className="text-nocturne-ink-faint">—</span>
                    )}
                  </span>
                  <span>
                    <span className="xl:hidden">Applied </span>
                    <span className="nocturne-mono font-medium text-nocturne-ink">{formatDate(app.appliedAt)}</span>
                  </span>
                  {app.knockoutFlagged && <ScreeningFlagBadge className="xl:hidden" />}
                </div>

                <div className="col-start-2 row-start-1 flex flex-wrap items-center justify-end gap-1.5 justify-self-end xl:col-start-auto xl:row-start-auto xl:justify-start xl:justify-self-start">
                  <StatusPill kind="application" status={app.status}>
                    {applicationStatusLabel(app.status)}
                  </StatusPill>
                  {app.knockoutFlagged && <ScreeningFlagBadge className="hidden xl:inline-flex" />}
                </div>

                <div className="col-span-2 flex justify-end border-t border-nocturne-border pt-3 xl:col-span-1 xl:block xl:w-36 xl:border-0 xl:pt-0 xl:text-right">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className={nocturneButtonVariants({ variant: "secondary", size: "sm", className: "h-8.5 px-3" })}
                  >
                    View Application
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
