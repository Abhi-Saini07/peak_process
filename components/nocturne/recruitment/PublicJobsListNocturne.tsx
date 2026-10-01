"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion, type Variants } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, RotateCcw, Search, SearchX } from "lucide-react";
import { employmentTypeLabel, workModeLabel } from "@/lib/recruitment/constants";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import {
  CareersFooter,
  JobMetaRow,
  JobsHero,
  NAV_FORWARD,
  careersContainer,
  experienceRange,
  teamEyebrowClass,
} from "@/components/nocturne/recruitment/careersUi";
import { NocturneFilterSelect } from "@/components/nocturne/ui/NocturneFilterSelect";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { cn } from "@/lib/utils/cn";
import type { PublicJobSummary } from "@/types/recruitment";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
/** Delay between consecutive cards on first load. */
const STAGGER_S = 0.05;

/** How long after first load the stagger applies. Cards that mount later
 *  (after a filter change) animate in straight away. */
const STAGGER_WINDOW_MS = 1000;

// Each card animates itself: variants set on a parent don't propagate
// through AnimatePresence, so the stagger is a per-card delay (`custom`).
const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 0.36, ease: EASE_OUT, delay } }),
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } },
};

const roleWord = (n: number) => (n === 1 ? "role" : "roles");

/** Hover / keyboard-focus treatment of a job card: accent hairline, a faint
 *  accent wash from the top and the Nocturne glow. */
const cardActiveClass =
  "hover:border-nocturne-accent/45 hover:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-nocturne-accent)_8%,var(--color-nocturne-card)),var(--color-nocturne-card))] hover:shadow-nocturne-glow focus-within:border-nocturne-accent/60 focus-within:shadow-nocturne-glow";

/**
 * One job as a card: team eyebrow, Sora title, meta tags and a muted
 * footer. The title link stretches over the whole card; "Apply now" sits
 * above it. Phones get the compact version (title + one muted line).
 */
function JobCard({ job, delay }: { job: PublicJobSummary; delay: number }) {
  const experience = experienceRange(job.experienceMinYears, job.experienceMaxYears);
  const mobileSub = [job.location, employmentTypeLabel(job.employmentType), workModeLabel(job.workMode)]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.li
      layout="position"
      variants={rowVariants}
      custom={delay}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ layout: { duration: 0.28, ease: EASE_OUT } }}
      className={cn(
        "group relative flex min-w-0 flex-col rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-4 py-3.5 shadow-nocturne-rest transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none sm:px-6.5 sm:py-6",
        cardActiveClass,
      )}
    >
      <div className="flex min-h-0 items-center justify-between gap-3 sm:min-h-9.5">
        {job.department ? <p className={cn(teamEyebrowClass, "truncate")}>{job.department}</p> : <span />}
        <span
          aria-hidden
          className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-nocturne-raised text-nocturne-ink transition-[background-color,color,translate] duration-200 group-hover:translate-x-0.5 group-hover:bg-nocturne-accent group-hover:text-nocturne-on-accent motion-reduce:transition-none max-sm:hidden"
        >
          <ArrowRight className="size-4.5" />
        </span>
      </div>
      <h3 className="mt-2 font-nocturne-display text-[1.1875rem] leading-tight font-semibold tracking-[-0.02em] text-balance text-nocturne-ink sm:mt-2.5 sm:text-2xl">
        <Link
          href={`/jobs/${job.id}`}
          transitionTypes={NAV_FORWARD}
          className="outline-none after:absolute after:inset-0 after:rounded-nocturne-card focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-nocturne-accent"
        >
          {job.title}
        </Link>
      </h3>
      <JobMetaRow job={job} showExperience={false} className="mt-3.5 max-sm:hidden" />
      {mobileSub && <p className="mt-1 text-[0.8125rem] text-nocturne-ink-muted sm:hidden">{mobileSub}</p>}
      <div className="mt-auto flex items-center justify-between gap-4 pt-4 max-sm:hidden">
        <p className="text-[0.8125rem] text-nocturne-ink-muted">{experience ? `${experience} experience` : " "}</p>
        <Link
          href={`/jobs/${job.id}/apply`}
          transitionTypes={NAV_FORWARD}
          className="relative z-10 rounded-nocturne-control text-[0.8125rem] font-bold whitespace-nowrap text-nocturne-accent-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
        >
          Apply now
          <span className="sr-only">: {job.title}</span>
        </Link>
      </div>
    </motion.li>
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
      className="mt-5 flex flex-col items-center rounded-nocturne-card border border-dashed border-nocturne-border-strong/60 bg-nocturne-card px-6 py-14 text-center shadow-nocturne-rest sm:py-16"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-nocturne-accent-tint text-nocturne-accent-text">
        <Icon className="size-5.5" aria-hidden />
      </span>
      <h2 className="mt-5 font-nocturne-display text-[1.375rem] leading-snug font-semibold tracking-[-0.015em] text-nocturne-ink">
        {title}
      </h2>
      <p className="nocturne-type-body mt-1.5 max-w-md text-balance text-nocturne-ink-muted">{children}</p>
      {action && <div className="mt-7">{action}</div>}
    </motion.div>
  );
}

/** Hero stat tiles: big Sora numbers computed from the live job list. */
function StatTiles({ stats }: { stats: { value: number; label: string }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex min-w-0 flex-col-reverse justify-end gap-1 rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-3 py-3 shadow-nocturne-rest sm:gap-1.5 sm:px-4.5 sm:py-4.5"
        >
          <dt className="text-xs leading-snug text-nocturne-ink-muted sm:text-[0.8125rem]">{stat.label}</dt>
          <dd className="nocturne-mono text-[1.75rem] leading-none font-semibold tracking-[-0.02em] text-nocturne-accent-text sm:text-[2.5rem]">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Team (department) filter as a row of chips beside the "Open positions" heading. */
function TeamChips({
  teams,
  value,
  onChange,
}: {
  teams: { name: string; count: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const chips = [{ value: "all", name: "All" }, ...teams.map((t) => ({ value: t.name, name: t.name }))];
  return (
    <div role="group" aria-label="Filter by team" className="flex flex-wrap gap-1.5 sm:justify-end">
      {chips.map((chip) => {
        const active = value === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              "inline-flex h-8.5 max-w-full items-center rounded-nocturne-pill px-3.5 text-[0.8125rem] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent",
              active
                ? "bg-nocturne-accent text-nocturne-on-accent shadow-nocturne-rest"
                : "border border-nocturne-border-strong/70 bg-nocturne-card text-nocturne-ink-muted hover:border-nocturne-border-strong hover:bg-nocturne-raised hover:text-nocturne-ink",
            )}
          >
            <span className="truncate">{chip.name}</span>
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

  // "/" jumps to the search box, unless the user is typing somewhere.
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

  // "Find roles": the filters already apply as you type/choose, so the
  // button takes you (and screen-reader focus) to the results.
  const resultsRef = useRef<HTMLHeadingElement>(null);
  function showResults(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const heading = resultsRef.current;
    if (!heading) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    heading.focus({ preventScroll: true });
  }

  const search =
    jobs.length > 0 ? (
      <form
        role="search"
        aria-label="Search open roles"
        onSubmit={showResults}
        className="flex max-w-[42.5rem] flex-col rounded-nocturne-card bg-nocturne-card p-1.5 shadow-nocturne-lift ring-1 ring-nocturne-border-strong transition-shadow duration-150 ring-inset has-[input:focus]:shadow-nocturne-glow has-[input:focus]:ring-2 has-[input:focus]:ring-nocturne-accent sm:h-14 sm:flex-row sm:items-center sm:py-0 sm:pr-2 sm:pl-4.5"
      >
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 px-2.5 sm:px-0">
          <span className="sr-only">Search roles</span>
          <Search className="pointer-events-none size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles…"
            aria-keyshortcuts="/"
            className="peer h-full min-w-0 flex-1 bg-transparent text-[0.9375rem] text-nocturne-ink outline-none placeholder:text-nocturne-ink-muted"
          />
          <kbd
            aria-hidden
            className="mr-2 shrink-0 rounded-[5px] px-1.5 py-px font-nocturne-mono text-xs text-nocturne-ink-muted ring-1 ring-nocturne-border-strong ring-inset peer-focus:hidden peer-[:not(:placeholder-shown)]:hidden max-sm:hidden"
          >
            /
          </kbd>
        </label>
        <div className="flex items-center gap-1.5 max-sm:border-t max-sm:border-nocturne-border max-sm:pt-1.5">
          <NocturneFilterSelect
            label="Location"
            value={location}
            onChange={setLocation}
            options={[{ value: "all", label: "All locations" }, ...locations.map((l) => ({ value: l, label: l }))]}
            className="min-w-0 flex-1 sm:w-44 sm:flex-none sm:border-l sm:border-nocturne-border-strong/60 sm:pl-1.5"
            triggerClassName="h-10 w-full rounded-nocturne-control px-3 text-sm font-semibold text-nocturne-ink outline-none transition-colors duration-150 hover:bg-nocturne-raised focus-visible:ring-2 focus-visible:ring-nocturne-accent aria-expanded:bg-nocturne-raised"
          />
          <NocturneButton type="submit" className="h-10 shrink-0 px-4.5">
            Find roles
          </NocturneButton>
        </div>
      </form>
    ) : undefined;

  const stats =
    jobs.length > 0 ? (
      <StatTiles
        stats={[
          { value: jobs.length, label: `open ${roleWord(jobs.length)}` },
          { value: teams.length, label: teams.length === 1 ? "team hiring" : "teams hiring" },
          { value: locations.length, label: locations.length === 1 ? "location" : "locations" },
        ]}
      />
    ) : undefined;

  return (
    // Honour the OS "reduce motion" setting for every Framer animation below.
    <MotionConfig reducedMotion="user">
      <NocturneCareersFrame>
        <JobsHero eyebrow={jobs.length > 0 ? "We’re hiring" : undefined} search={search} stats={stats} />

        <main className={`${careersContainer} pt-4 pb-16 sm:pt-6 sm:pb-20`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2
                ref={resultsRef}
                tabIndex={-1}
                className="scroll-mt-6 font-nocturne-display text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] text-nocturne-ink outline-none max-sm:text-[1.375rem]"
              >
                Open positions
              </h2>
              {jobs.length > 0 && (
                <p className="text-[0.8125rem] text-nocturne-ink-muted" aria-live="polite">
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
            {teams.length > 0 && <TeamChips teams={teams} value={department} onChange={setDepartment} />}
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
            <ul aria-label="Open positions" className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4">
              <AnimatePresence initial>
                {filtered.map((job, index) => (
                  <JobCard key={job.id} job={job} delay={staggerDone ? 0 : index * STAGGER_S} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </main>

        <CareersFooter />
      </NocturneCareersFrame>
    </MotionConfig>
  );
}
