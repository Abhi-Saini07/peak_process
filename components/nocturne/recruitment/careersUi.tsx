import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Banknote, Briefcase, Clock, MapPin, TrendingUp } from "lucide-react";
import { employmentTypeLabel, workModeLabel } from "@/lib/recruitment/constants";
import { cn } from "@/lib/utils/cn";
import type { PublicJobSummary } from "@/types/recruitment";

/** Shared building blocks for the Nocturne careers pages (list, detail,
 *  apply, confirmation) so repeated elements stay identical everywhere. */

/** One content column for header, hero, body and footer so their edges line up. */
export const careersContainer = "mx-auto w-full max-w-[76rem] px-4 sm:px-8 tablet:px-10";

/** Navigation direction tags for <Link transitionTypes> (styled in
 *  globals.css). Deeper into the flow (list → detail → apply) is forward;
 *  returning is back. */
export const NAV_FORWARD = ["nocturne-nav-forward"];
export const NAV_BACK = ["nocturne-nav-back"];

/** Shared look for the compact filter dropdowns next to the jobs table. */
export const filterControlClass =
  "h-9 w-full rounded-nocturne-control border border-nocturne-border-strong bg-nocturne-card px-3 text-[0.8125rem] font-semibold text-nocturne-ink outline-none transition-[border-color,box-shadow] duration-150 hover:border-nocturne-ink-muted focus-visible:border-nocturne-accent focus-visible:ring-3 focus-visible:ring-nocturne-accent/20";

/** White bordered panel (Ledger: hairline border, 12px corners, low shadow). */
export const panelClass = "rounded-nocturne-card border border-nocturne-border bg-nocturne-card shadow-nocturne-rest";

/** Sage guidance panel ("Interested?", "What happens next"). */
export const softPanelClass = "rounded-nocturne-card bg-nocturne-surface";

/** Rounded sage band that opens the careers pages (sits inside the container). */
export const bandClass = "rounded-3xl bg-nocturne-surface";

/** Team (department) pill: pine on tint. */
export const teamPillClass =
  "inline-flex items-center rounded-nocturne-pill bg-nocturne-accent-tint px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap text-nocturne-accent-text";

/** Neutral pill for employment type. */
export const typePillClass =
  "inline-flex items-center rounded-nocturne-pill bg-nocturne-surface-2 px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap text-nocturne-ink";

/** Serif section heading used inside panels. */
export const panelHeadingClass = "font-nocturne-display text-[1.3125rem] leading-snug font-semibold text-nocturne-ink";

export function experienceRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}–${max} Years`;
  if (min != null) return `${min}+ Years`;
  return `Up to ${max} Years`;
}

export function formatSalary(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  return `Up to ${fmt(max as number)}`;
}

type Icon = typeof MapPin;

/** Inline icon + label used in the job detail meta row. */
export function MetaItem({ icon: Icon, children }: { icon: Icon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-nocturne-ink">
      <Icon className="size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
      {children}
    </span>
  );
}

/** The meta row under a job title: location, type, work mode, experience (+ salary if public). */
export function JobMetaRow({
  job,
  salary,
  className,
}: {
  job: PublicJobSummary;
  salary?: string | null;
  className?: string;
}) {
  const experience = experienceRange(job.experienceMinYears, job.experienceMaxYears);
  return (
    <ul className={cn("flex flex-wrap gap-x-5 gap-y-2", className)} aria-label="Role details">
      {job.location && (
        <li>
          <MetaItem icon={MapPin}>{job.location}</MetaItem>
        </li>
      )}
      <li>
        <MetaItem icon={Briefcase}>{employmentTypeLabel(job.employmentType)}</MetaItem>
      </li>
      <li>
        <MetaItem icon={Clock}>{workModeLabel(job.workMode)}</MetaItem>
      </li>
      {experience && (
        <li>
          <MetaItem icon={TrendingUp}>{experience}</MetaItem>
        </li>
      )}
      {salary && (
        <li>
          <MetaItem icon={Banknote}>{salary}</MetaItem>
        </li>
      )}
    </ul>
  );
}

function FactRow({ icon: Icon, label, value }: { icon: Icon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-medium text-nocturne-ink-muted">{label}</dt>
        <dd className="text-sm font-semibold text-nocturne-ink">{value}</dd>
      </div>
    </div>
  );
}

/** Label/value list of a job's facts (detail sidebar, apply summary). */
export function JobFacts({
  job,
  salary,
  showLocation = true,
  className,
}: {
  job: PublicJobSummary;
  salary?: string | null;
  showLocation?: boolean;
  className?: string;
}) {
  const experience = experienceRange(job.experienceMinYears, job.experienceMaxYears);
  return (
    <dl className={cn("flex flex-col gap-3.5", className)}>
      {showLocation && job.location && <FactRow icon={MapPin} label="Location" value={job.location} />}
      <FactRow icon={Briefcase} label="Employment type" value={employmentTypeLabel(job.employmentType)} />
      <FactRow icon={Clock} label="Work mode" value={workModeLabel(job.workMode)} />
      {experience && <FactRow icon={TrendingUp} label="Experience" value={experience} />}
      {salary && <FactRow icon={Banknote} label="Salary" value={salary} />}
    </dl>
  );
}

/** Sidebar summary card on the apply page: eyebrow, serif title, team · location, facts. */
export function JobSummaryCard({
  eyebrow,
  job,
  salary,
  children,
}: {
  eyebrow: string;
  job: PublicJobSummary;
  salary?: string | null;
  children?: ReactNode;
}) {
  const subtitle = [job.department, job.location].filter(Boolean).join(" · ");
  return (
    <div className={cn(panelClass, "p-5 sm:px-6")}>
      <p className="nocturne-type-eyebrow text-nocturne-accent-text">{eyebrow}</p>
      <p className="mt-2 font-nocturne-display text-[1.375rem] leading-tight font-semibold text-nocturne-ink">
        {job.title}
      </p>
      {subtitle && <p className="mt-1 text-[0.9375rem] text-nocturne-ink-muted">{subtitle}</p>}
      <JobFacts job={job} salary={salary} showLocation={false} className="mt-4 border-t border-nocturne-border pt-4" />
      {children}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      transitionTypes={NAV_BACK}
      className="group inline-flex max-w-full items-center gap-1.5 rounded-nocturne-control text-[0.8125rem] font-semibold text-nocturne-ink-muted transition-colors hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nocturne-accent"
    >
      <ArrowLeft
        className="size-4 shrink-0 transition-transform duration-150 group-hover:-translate-x-0.5 motion-reduce:transition-none"
        aria-hidden
      />
      <span className="truncate">{children}</span>
    </Link>
  );
}

/** Rounded sage band at the top of the apply and confirmation pages. */
export function CareersBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${careersContainer} pt-5 sm:pt-6`}>
      <div className={cn(bandClass, "px-5 py-6 sm:px-10 sm:py-7", className)}>{children}</div>
    </div>
  );
}

/** Hero band for the jobs list. The copy is static and shared with the
 *  loading skeleton so the page doesn't shift when the real list arrives;
 *  `search` sits under the lead and `teams` fills the right column.
 *  Placeholder marketing copy: replace with approved wording. */
export function JobsHero({ search, teams }: { search?: ReactNode; teams?: ReactNode }) {
  return (
    <div className={`${careersContainer} pt-3 sm:pt-6`}>
      <div
        className={cn(
          bandClass,
          "grid grid-cols-1 items-center gap-8 px-5 py-6 sm:px-10 sm:py-9 tablet:grid-cols-[1.2fr_1fr] tablet:gap-12 tablet:px-11",
        )}
      >
        <div className="min-w-0">
          <p className="nocturne-type-eyebrow text-nocturne-accent-text">Join us</p>
          <h1 className="mt-2.5 font-nocturne-display text-[clamp(1.75rem,1.1rem+2.6vw,3.125rem)] leading-[1.06] font-semibold tracking-[-0.02em] text-balance text-nocturne-ink">
            Find work that moves people forward.
          </h1>
          <p className="mt-3 max-w-[29rem] text-[0.9375rem] leading-relaxed text-nocturne-ink-muted sm:text-base">
            Join a team redefining operational excellence — explore open roles across engineering, operations, and
            beyond.
          </p>
          {search && <div className="mt-4 sm:mt-5">{search}</div>}
        </div>
        {teams && <div className="min-w-0 max-sm:hidden">{teams}</div>}
      </div>
    </div>
  );
}

/** Small footer shared by the list page and its skeleton. */
export function CareersFooter() {
  return (
    <footer className={`${careersContainer} pb-10`}>
      <p className="border-t border-nocturne-border pt-8 text-center text-[0.8125rem] text-nocturne-ink-muted">
        Don{"’"}t see the right fit? Check back soon — we{"’"}re always growing.
      </p>
    </footer>
  );
}
