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

/** Soft periwinkle light falling from the top-left of a page section.
 *  Mixed from the accent token, so it follows the theme. */
export const heroGlowClass =
  "bg-[radial-gradient(50rem_20rem_at_18%_0%,color-mix(in_oklab,var(--color-nocturne-accent)_14%,transparent),transparent_70%)]";

/** Shared look for compact filter dropdown triggers. */
export const filterControlClass =
  "h-9 w-full rounded-nocturne-control border border-nocturne-border-strong bg-nocturne-card px-3 text-[0.8125rem] font-semibold text-nocturne-ink outline-none transition-[border-color,box-shadow] duration-150 hover:border-nocturne-ink-muted focus-visible:border-nocturne-accent focus-visible:ring-3 focus-visible:ring-nocturne-accent/20";

/** Card surface: hairline border, 14px corners, resting shadow (visible in light). */
export const panelClass = "rounded-nocturne-card border border-nocturne-border bg-nocturne-card shadow-nocturne-rest";

/** Quieter tinted panel for guidance ("What happens next"). */
export const softPanelClass = "rounded-nocturne-card border border-nocturne-border bg-nocturne-surface";

/** The focused card on a page (apply call-to-action, confirmation): accent
 *  hairline, a faint accent wash from the top and the Nocturne glow. */
export const glowPanelClass =
  "rounded-nocturne-card border border-nocturne-accent/45 bg-nocturne-card bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-nocturne-accent)_9%,var(--color-nocturne-card)),var(--color-nocturne-card)_75%)] shadow-nocturne-glow";

/** Uppercase team label above a job title. */
export const teamEyebrowClass = "text-xs leading-none font-bold tracking-[0.1em] text-nocturne-accent-text uppercase";

/** Team (department) pill: accent text on accent tint. */
export const teamPillClass =
  "inline-flex items-center rounded-nocturne-pill bg-nocturne-accent-tint px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap text-nocturne-accent-text";

/** Raised meta tag (location, type, work mode) with a leading icon. */
export const metaTagClass =
  "inline-flex h-7.5 max-w-full items-center gap-1.5 rounded-nocturne-pill bg-nocturne-raised px-3 text-[0.8125rem] font-medium whitespace-nowrap text-nocturne-ink";

/** Neutral pill for employment type. */
export const typePillClass =
  "inline-flex items-center rounded-nocturne-pill bg-nocturne-raised px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap text-nocturne-ink";

/** Section heading used inside panels (Sora). */
export const panelHeadingClass =
  "font-nocturne-display text-[1.25rem] leading-snug font-semibold tracking-[-0.015em] text-nocturne-ink";

/** Big Sora page title on detail / apply. */
export const pageTitleClass =
  "font-nocturne-display text-[clamp(2rem,1.4rem+2.4vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-balance text-nocturne-ink";

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

/** Raised pill with icon + label (job meta row, job cards). */
export function MetaItem({ icon: Icon, children }: { icon: Icon; children: ReactNode }) {
  return (
    <span className={metaTagClass}>
      <Icon className="size-3.5 shrink-0 text-nocturne-ink-muted" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

/** The meta row under a job title: location, type, work mode, experience (+ salary if public). */
export function JobMetaRow({
  job,
  salary,
  showExperience = true,
  className,
}: {
  job: PublicJobSummary;
  salary?: string | null;
  showExperience?: boolean;
  className?: string;
}) {
  const experience = showExperience ? experienceRange(job.experienceMinYears, job.experienceMaxYears) : null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Role details">
      {job.location && (
        <li className="max-w-full">
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
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-nocturne-control bg-nocturne-raised">
        <Icon className="size-4 text-nocturne-ink-muted" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-nocturne-ink-muted">{label}</dt>
        <dd className="text-sm font-bold text-nocturne-ink">{value}</dd>
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

/** Sidebar summary card on the apply page: eyebrow, Sora title, team, facts. */
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
  return (
    <div className={cn(panelClass, "p-5 sm:px-6 sm:py-5.5")}>
      <p className="nocturne-type-eyebrow text-nocturne-accent-text">{eyebrow}</p>
      <p className="mt-2 font-nocturne-display text-[1.25rem] leading-tight font-semibold tracking-[-0.015em] text-nocturne-ink">
        {job.title}
      </p>
      {job.department && <p className="mt-1.5 text-[0.9375rem] text-nocturne-ink-muted">{job.department}</p>}
      <JobFacts job={job} salary={salary} className="mt-4 border-t border-nocturne-border pt-4" />
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

/** Opening section of the detail, apply and confirmation pages: the hero
 *  glow behind the page heading, inside the shared container. */
export function CareersBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={heroGlowClass}>
      <div className={cn(careersContainer, "pt-7 sm:pt-10", className)}>{children}</div>
    </div>
  );
}

/** Hero for the jobs list. The copy is static and shared with the loading
 *  skeleton so the page doesn't shift when the real list arrives; `search`
 *  sits under the lead and `stats` fills the right column (below the
 *  heading on phones). */
export function JobsHero({
  search,
  stats,
  eyebrow = "Join us",
}: {
  search?: ReactNode;
  stats?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className={heroGlowClass}>
      <div
        className={cn(
          careersContainer,
          "grid grid-cols-1 gap-5 pt-6 pb-6 sm:gap-8 sm:pt-14 sm:pb-10 tablet:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] tablet:items-end tablet:gap-12",
        )}
      >
        <div className="min-w-0">
          <p className="nocturne-type-eyebrow text-nocturne-accent-text max-sm:hidden">{eyebrow}</p>
          <h1 className="font-nocturne-display text-[clamp(1.875rem,1.2rem+2.9vw,3.625rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-nocturne-ink sm:mt-3.5">
            Find work that moves people forward.
          </h1>
          <p className="mt-4 max-w-[34rem] text-[1.0625rem] leading-relaxed text-nocturne-ink-muted max-sm:hidden">
            Join a team redefining operational excellence — explore open roles across engineering, operations, and
            beyond.
          </p>
          {search && <div className="mt-4 sm:mt-7">{search}</div>}
        </div>
        {stats && <div className="min-w-0">{stats}</div>}
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
