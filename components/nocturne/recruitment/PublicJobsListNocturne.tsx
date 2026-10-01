"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion, type Variants } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, MapPin, RotateCcw, Search, SearchX } from "lucide-react";
import { employmentTypeLabel, workModeLabel } from "@/lib/recruitment/constants";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import {
  CareersFooter,
  JobsHero,
  NAV_FORWARD,
  careersContainer,
  experienceRange,
  filterControlClass,
  teamPillClass,
  typePillClass,
} from "@/components/nocturne/recruitment/careersUi";
import { NocturneFilterSelect } from "@/components/nocturne/ui/NocturneFilterSelect";
import { NocturneButton, nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { cn } from "@/lib/utils/cn";
import type { PublicJobSummary } from "@/types/recruitment";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Delay between consecutive rows on first load. */
const STAGGER_S = 0.05;

/** How long after first load the stagger applies. Rows that mount later
 *  (after a filter change) animate in straight away. */
const STAGGER_WINDOW_MS = 1000;

// Each row animates itself: variants set on a parent don't propagate
// through AnimatePresence, so the stagger is a per-row delay (`custom`).
const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE_OUT, delay } }),
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } },
};

const roleWord = (n: number) => (n === 1 ? "role" : "roles");

/** Header cell of the jobs table. */
const thClass =
  "border-b border-nocturne-border bg-nocturne-table-head px-5 py-3 text-left text-[0.6875rem] font-bold tracking-[0.1em] text-nocturne-ink-muted uppercase";

/**
 * One job as a table row. From the tablet breakpoint up it's a Ledger
 * table row; below it the same cells restack into a bordered row card
 * (title + team · location on the left, type pill on the right) and the
 * title link stretches over the whole card.
 */
function JobRow({ job, delay }: { job: PublicJobSummary; delay: number }) {
  const experience = experienceRange(job.experienceMinYears, job.experienceMaxYears);
  const detailSub = [experience, workModeLabel(job.workMode)].filter(Boolean).join(" · ");
  const mobileSub = [job.department, job.location].filter(Boolean).join(" · ");

  return (
    <motion.tr
      layout="position"
      variants={rowVariants}
      custom={delay}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ layout: { duration: 0.28, ease: EASE_OUT } }}
      className={cn(
        "group relative transition-colors duration-150 tablet:hover:bg-nocturne-surface/60 tablet:[&:last-child>td]:border-b-0 tablet:[&>td]:border-b tablet:[&>td]:border-nocturne-border",
        "max-tablet:flex max-tablet:items-center max-tablet:justify-between max-tablet:gap-3 max-tablet:rounded-nocturne-card max-tablet:border max-tablet:border-nocturne-border max-tablet:bg-nocturne-card max-tablet:p-3.5 max-tablet:shadow-nocturne-rest max-tablet:focus-within:border-nocturne-accent",
      )}
    >
      <td className="min-w-0 tablet:py-3.5 tablet:pr-4 tablet:pl-5">
        <Link
          href={`/jobs/${job.id}`}
          transitionTypes={NAV_FORWARD}
          className="rounded-nocturne-control text-[0.9375rem] leading-snug font-bold text-nocturne-ink transition-colors outline-none hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent max-tablet:after:absolute max-tablet:after:inset-0 max-tablet:after:rounded-nocturne-card max-tablet:focus-visible:outline-none"
        >
          {job.title}
        </Link>
        <p className="mt-0.5 text-[0.8125rem] text-nocturne-ink-muted max-tablet:hidden">{detailSub}</p>
        {mobileSub && <p className="mt-0.5 text-xs text-nocturne-ink-muted tablet:hidden">{mobileSub}</p>}
      </td>
      <td className="px-4 py-3.5 max-tablet:hidden">
        {job.department ? (
          <span className={teamPillClass}>{job.department}</span>
        ) : (
          <span className="text-nocturne-ink-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-nocturne-ink max-tablet:hidden">
        {job.location ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
            {job.location}
          </span>
        ) : (
          <span className="text-nocturne-ink-muted">—</span>
        )}
      </td>
      <td className="shrink-0 tablet:px-4 tablet:py-3.5">
        <span className={typePillClass}>{employmentTypeLabel(job.employmentType)}</span>
      </td>
      <td className="py-3 pr-5 pl-4 max-tablet:hidden">
        <div className="flex items-center justify-end gap-5">
          <Link
            href={`/jobs/${job.id}/apply`}
            transitionTypes={NAV_FORWARD}
            className={nocturneButtonVariants({ variant: "secondary", size: "sm" })}
          >
            Apply now
          </Link>
          <Link
            href={`/jobs/${job.id}`}
            transitionTypes={NAV_FORWARD}
            aria-label={`View role: ${job.title}`}
            className="group/link inline-flex items-center gap-1.5 rounded-nocturne-control text-sm font-bold whitespace-nowrap text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
          >
            View role
            <ArrowRight
              className="size-4 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        </div>
      </td>
    </motion.tr>
  );
}

function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: typeof SearchX;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className="mt-4 flex flex-col items-center rounded-nocturne-card border border-dashed border-nocturne-border-strong/50 bg-nocturne-card px-6 py-14 text-center sm:py-16"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-nocturne-surface text-nocturne-accent-text">
        <Icon className="size-5.5" aria-hidden />
      </span>
      <h2 className="mt-5 font-nocturne-display text-[1.375rem] leading-snug font-semibold text-nocturne-ink">{title}</h2>
      <p className="nocturne-type-body mt-1.5 max-w-md text-balance text-nocturne-ink-muted">{children}</p>
      {action && <div className="mt-7">{action}</div>}
    </motion.div>
  );
}

/** Team (department) filter as tiles in the hero, per the Nocturne careers design. */
function TeamTiles({
  teams,
  total,
  value,
  onChange,
}: {
  teams: { name: string; count: number }[];
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const tiles = [{ value: "all", name: "All teams", count: total }, ...teams.map((t) => ({ value: t.name, ...t }))];
  return (
    <div
      role="group"
      aria-label="Filter by team"
      // Two columns while the tiles fit in two rows, so long team names get room.
      className={cn("grid grid-cols-2 gap-2.5", tiles.length > 4 && "sm:grid-cols-3")}
    >
      {tiles.map((tile) => {
        const active = value === tile.value;
        return (
          <button
            key={tile.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tile.value)}
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-nocturne-card px-4 py-3.5 text-left transition-[background-color,box-shadow,translate] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent motion-reduce:transition-none",
              active
                ? "bg-nocturne-forest shadow-nocturne-rest ring-1 ring-nocturne-accent/60 ring-inset"
                : "bg-nocturne-card shadow-nocturne-rest hover:-translate-y-px hover:shadow-nocturne-lift",
            )}
          >
            <span
              className={cn(
                "line-clamp-2 font-nocturne-display text-[1.1875rem] leading-tight font-semibold break-words",
                active ? "text-white" : "text-nocturne-ink",
              )}
            >
              {tile.name}
            </span>
            <span className={cn("text-[0.8125rem] font-bold", active ? "text-nocturne-forest-gold" : "text-nocturne-gold")}>
              {tile.count} {roleWord(tile.count)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Phone version of the team filter: a wrapping row of chips under the hero. */
function TeamChips({
  teams,
  total,
  value,
  onChange,
}: {
  teams: { name: string; count: number }[];
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  const chips = [{ value: "all", name: "All", count: total }, ...teams.map((t) => ({ value: t.name, ...t }))];
  return (
    <div role="group" aria-label="Filter by team" className="flex flex-wrap gap-1.5 sm:hidden">
      {chips.map((chip) => {
        const active = value === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              "inline-flex h-8 max-w-full items-center gap-1.5 rounded-nocturne-pill px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent",
              active
                ? "bg-nocturne-forest text-white ring-1 ring-nocturne-accent/60 ring-inset"
                : "border border-nocturne-border-strong bg-nocturne-card text-nocturne-ink hover:border-nocturne-accent",
            )}
          >
            <span className="truncate">{chip.name}</span>
            <span className={cn("nocturne-mono", active ? "text-nocturne-forest-gold" : "text-nocturne-ink-muted")}>
              {chip.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PublicJobsListNocturne({ jobs }: { jobs: PublicJobSummary[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [location, setLocation] = useState("all");

  const teams = useMemo(() => {
    const counts = new Map<string, number>();
    for (const j of jobs) if (j.department) counts.set(j.department, (counts.get(j.department) ?? 0) + 1);
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs]);
  const locations = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.location).filter((l): l is string => Boolean(l)))).sort(),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (department === "all" || j.department === department) &&
        (location === "all" || j.location === location) &&
        (q === "" || j.title.toLowerCase().includes(q) || (j.department ?? "").toLowerCase().includes(q)),
    );
  }, [jobs, query, department, location]);

  const hasFilters = query !== "" || department !== "all" || location !== "all";

  const searchRef = useRef<HTMLInputElement>(null);
  function clearFilters() {
    setQuery("");
    setDepartment("all");
    setLocation("all");
    // The button that was clicked disappears; keep keyboard focus in the filters.
    searchRef.current?.focus();
  }

  // "/" jumps to the search box (Ledger shortcut), unless the user is typing somewhere.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='combobox']"))
        return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const [staggerDone, setStaggerDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStaggerDone(true), STAGGER_WINDOW_MS);
    return () => clearTimeout(timer);
  }, []);

  const search =
    jobs.length > 0 ? (
      <label className="relative flex h-12 max-w-[29.5rem] items-center gap-2.5 rounded-nocturne-control bg-nocturne-card px-3.5 shadow-nocturne-lift ring-1 ring-nocturne-border-strong transition-shadow duration-150 ring-inset focus-within:ring-2 focus-within:ring-nocturne-accent">
        <span className="sr-only">Search roles</span>
        <Search className="pointer-events-none size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles…"
          aria-keyshortcuts="/"
          className="peer h-full min-w-0 flex-1 bg-transparent text-sm text-nocturne-ink outline-none placeholder:text-nocturne-ink-muted"
        />
        <kbd
          aria-hidden
          className="shrink-0 rounded-[5px] px-1.5 py-px font-nocturne-mono text-xs text-nocturne-ink-muted ring-1 ring-nocturne-border-strong ring-inset peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden max-sm:hidden"
        >
          /
        </kbd>
      </label>
    ) : undefined;

  const teamTiles =
    teams.length > 0 ? (
      <TeamTiles teams={teams} total={jobs.length} value={department} onChange={setDepartment} />
    ) : undefined;

  return (
    // Honour the OS "reduce motion" setting for every Framer animation below.
    <MotionConfig reducedMotion="user">
      <NocturneCareersFrame>
        <JobsHero search={search} teams={teamTiles} />

        <main className={`${careersContainer} pt-5 pb-16 sm:pt-8 sm:pb-20`}>
          {teams.length > 0 && (
            <div className="mb-4 sm:hidden">
              <TeamChips teams={teams} total={jobs.length} value={department} onChange={setDepartment} />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-nocturne-display text-[1.75rem] leading-tight font-semibold tracking-[-0.01em] text-nocturne-ink max-sm:text-2xl">
                Open positions
              </h2>
              {jobs.length > 0 && (
                <p className="nocturne-mono text-[0.8125rem] text-nocturne-ink-muted" aria-live="polite">
                  {hasFilters
                    ? `Showing ${filtered.length} of ${jobs.length} open ${roleWord(jobs.length)}`
                    : `${jobs.length} open ${roleWord(jobs.length)}`}
                </p>
              )}
              {hasFilters && filtered.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-nocturne-control text-[0.8125rem] font-semibold text-nocturne-accent-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
                >
                  Clear filters
                </button>
              )}
            </div>
            {jobs.length > 0 && (
              <NocturneFilterSelect
                label="Location"
                value={location}
                onChange={setLocation}
                options={[{ value: "all", label: "All locations" }, ...locations.map((l) => ({ value: l, label: l }))]}
                className="sm:w-48 sm:shrink-0"
                triggerClassName={filterControlClass}
              />
            )}
          </div>

          {jobs.length === 0 ? (
            <EmptyState icon={BriefcaseBusiness} title="No open positions right now">
              New roles are posted here as soon as they open. Check back soon.
            </EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No roles match your filters"
              action={
                <NocturneButton type="button" variant="secondary" onClick={clearFilters}>
                  <RotateCcw className="size-4" aria-hidden />
                  Clear filters
                </NocturneButton>
              }
            >
              Try a different search term, or clear the filters to see all {jobs.length} open{" "}
              {roleWord(jobs.length)}.
            </EmptyState>
          ) : (
            <div
              className={cn(
                "mt-4 tablet:overflow-hidden",
                "tablet:rounded-nocturne-card tablet:border tablet:border-nocturne-border tablet:bg-nocturne-card tablet:shadow-nocturne-rest",
              )}
            >
              <table className="w-full border-separate border-spacing-0 max-tablet:block">
                <caption className="sr-only">Open positions</caption>
                <thead className="max-tablet:hidden">
                  <tr>
                    <th scope="col" className={cn(thClass, "w-[34%]")}>
                      Role
                    </th>
                    <th scope="col" className={cn(thClass, "px-4")}>
                      Team
                    </th>
                    <th scope="col" className={cn(thClass, "px-4")}>
                      Location
                    </th>
                    <th scope="col" className={cn(thClass, "px-4")}>
                      Type
                    </th>
                    <th scope="col" className={thClass}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="max-tablet:flex max-tablet:flex-col max-tablet:gap-2">
                  <AnimatePresence initial>
                    {filtered.map((job, index) => (
                      <JobRow key={job.id} job={job} delay={staggerDone ? 0 : index * STAGGER_S} />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </main>

        <CareersFooter />
      </NocturneCareersFrame>
    </MotionConfig>
  );
}
