"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { applicationStatusLabel } from "@/lib/recruitment/constants";
import { stageAgeTone } from "@/lib/recruitment/board";
import type { JobHealth, OfferInFlight, StuckApplication, Trend } from "@/lib/recruitment/dashboard-metrics";
import { formatMoney } from "@/lib/recruitment/offers";
import { OfferAgeBadge } from "@/components/nocturne/recruitment/ApplicationOfferNocturne";
import type { DashboardKpis, NewToReviewItem } from "@/lib/server/dashboardRepository";
import {
  ScreeningFlagBadge,
  adminCardTitleClass,
  adminLabelClass,
  adminPanelClass,
} from "@/components/nocturne/recruitment/AdminShellNocturne";

/* ------------------------------------------------------------------ */
/* Shared pieces                                                      */
/* ------------------------------------------------------------------ */

function Bone({ className }: { className?: string }) {
  const shape = className?.includes("rounded-") ? undefined : "rounded-nocturne-pill";
  return <div aria-hidden className={cn("nocturne-skeleton", shape, className)} />;
}

function Widget({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(adminPanelClass, "flex min-w-0 flex-col", className)} aria-label={title}>
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 pt-5 pb-3 sm:px-5.5">
        <div className="min-w-0">
          <h2 className={adminCardTitleClass}>{title}</h2>
          {description && <p className="mt-0.5 text-[0.8125rem] text-nocturne-ink-muted">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-4 mb-5 rounded-nocturne-control border border-dashed border-nocturne-border px-4 py-8 text-center sm:mx-5.5">
      <p className="text-sm font-semibold text-nocturne-ink">{title}</p>
      <p className="mt-1 text-[0.8125rem] text-nocturne-ink-muted">{body}</p>
    </div>
  );
}

const rowLinkClass =
  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-nocturne-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-nocturne-accent sm:px-5.5";

function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-sm text-[0.8125rem] font-semibold text-nocturne-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-nocturne-accent"
    >
      {children} <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* KPI strip                                                          */
/* ------------------------------------------------------------------ */

function TrendChip({ trend }: { trend: Trend }) {
  const Icon = trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;
  const text =
    trend.percent == null
      ? trend.delta === 0
        ? "No change"
        : `${trend.delta > 0 ? "+" : ""}${trend.delta}`
      : `${trend.percent > 0 ? "+" : ""}${trend.percent}%`;
  return (
    <span
      className={cn(
        "nocturne-mono inline-flex h-6 items-center gap-1 rounded-nocturne-pill px-2 text-xs font-semibold",
        trend.direction === "up" && "bg-nocturne-success-tint text-nocturne-success",
        trend.direction === "down" && "bg-nocturne-gold-tint text-nocturne-gold",
        trend.direction === "flat" && "bg-nocturne-raised text-nocturne-ink-muted",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {text}
    </span>
  );
}

function Kpi({ label, value, href, footer }: { label: string; value: number; href: string; footer?: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        adminPanelClass,
        "group flex min-w-0 flex-col gap-2 px-4 py-4.5 transition-[border-color,box-shadow] hover:border-nocturne-border-strong hover:shadow-nocturne-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent sm:px-5",
      )}
    >
      <span className={adminLabelClass}>{label}</span>
      <span className="font-nocturne-display text-[2rem] leading-none font-semibold tracking-[-0.03em] text-nocturne-ink">
        {value}
      </span>
      <span className="flex min-h-6 flex-wrap items-center gap-2 text-xs text-nocturne-ink-muted">{footer}</span>
    </Link>
  );
}

export function DashboardKpiStrip({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Open jobs" value={kpis.openJobs} href="/admin/jobs" footer="Published and taking applications" />
      <Kpi
        label="Applications · 7 days"
        value={kpis.applicationsLast7}
        href="/admin/jobs"
        footer={
          <>
            <TrendChip trend={kpis.applicationsTrend} />
            <span>vs {kpis.applicationsPrevious7} the week before</span>
          </>
        }
      />
      <Kpi label="At interview" value={kpis.atInterview} href="/admin/jobs" footer="Across published jobs" />
      <Kpi label="Selected this month" value={kpis.selectedThisMonth} href="/admin/jobs" footer="Moved to Selected" />
    </div>
  );
}

export function DashboardKpiStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn(adminPanelClass, "flex flex-col gap-3 px-4 py-4.5 sm:px-5")}>
          <Bone className="h-3 w-24" />
          <Bone className="h-8 w-14 rounded-[6px]" />
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New to review                                                      */
/* ------------------------------------------------------------------ */

export function NewToReviewWidget({ items, total, now }: { items: NewToReviewItem[]; total: number; now: number }) {
  return (
    <Widget
      title="New to review"
      description={total === 0 ? undefined : `${total} waiting in Applied`}
    >
      {items.length === 0 ? (
        <EmptyState title="All caught up" body="New applications will show up here." />
      ) : (
        <ul className="border-t border-nocturne-border">
          {items.map((item) => (
            <li key={item.id} className="border-b border-nocturne-border last:border-b-0">
              <Link href={`/admin/applications/${item.id}`} className={rowLinkClass}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-nocturne-ink">{item.candidateName}</span>
                  <span className="block truncate text-xs text-nocturne-ink-muted">{item.jobTitle}</span>
                </span>
                {item.knockoutFlagged && <ScreeningFlagBadge compact className="h-6 px-2" />}
                <time
                  dateTime={item.appliedAt}
                  className="shrink-0 text-xs text-nocturne-ink-muted"
                  suppressHydrationWarning
                >
                  {formatRelativeTime(item.appliedAt, new Date(now))}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Needs attention                                                    */
/* ------------------------------------------------------------------ */

export function NeedsAttentionWidget({ items, total }: { items: StuckApplication[]; total: number }) {
  return (
    <Widget
      title="Needs attention"
      description={total === 0 ? undefined : `${total} in the same stage for 7+ days`}
    >
      {items.length === 0 ? (
        <EmptyState title="Nothing is stuck" body="Applications waiting 7+ days in one stage show up here." />
      ) : (
        <ul className="border-t border-nocturne-border">
          {items.map((item) => {
            const tone = stageAgeTone(item.days);
            return (
              <li key={item.id} className="border-b border-nocturne-border last:border-b-0">
                <Link href={`/admin/applications/${item.id}`} className={rowLinkClass}>
                  <span
                    className={cn(
                      "nocturne-mono inline-flex h-7 min-w-11 shrink-0 items-center justify-center rounded-nocturne-pill px-2 text-xs font-semibold",
                      tone === "danger" ? "bg-nocturne-error-tint text-nocturne-error" : "bg-nocturne-gold-tint text-nocturne-gold",
                    )}
                    aria-hidden
                  >
                    {item.days}d
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-nocturne-ink">{item.candidateName}</span>
                    <span className="block text-xs text-nocturne-ink-muted sm:truncate">
                      {item.reason} · {item.jobTitle}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-nocturne-ink-faint" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Offers in flight                                                   */
/* ------------------------------------------------------------------ */

export function OffersInFlightWidget({ offers }: { offers: OfferInFlight[] }) {
  return (
    <Widget title="Offers in flight" description={offers.length === 0 ? undefined : `${offers.length} waiting on candidates`}>
      {offers.length === 0 ? (
        <EmptyState title="No open offers" body="Offers you send show up here until the person is hired or declines." />
      ) : (
        <ul className="border-t border-nocturne-border">
          {offers.map((o) => (
            <li key={o.id} className="border-b border-nocturne-border last:border-b-0">
              <Link href={`/admin/applications/${o.id}`} className={rowLinkClass}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-nocturne-ink">{o.candidateName}</span>
                  <span className="block text-xs text-nocturne-ink-muted sm:truncate">
                    {o.jobTitle} · {formatMoney(o.salary, o.currency)} · sent {o.daysOut === 0 ? "today" : `${o.daysOut}d ago`}
                  </span>
                </span>
                <OfferAgeBadge age={o.age} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Job health                                                         */
/* ------------------------------------------------------------------ */

const STAGE_DOT: Record<string, string> = {
  applied: "bg-nocturne-ink-faint",
  under_review: "bg-nocturne-gold",
  shortlisted: "bg-nocturne-accent",
  interview: "bg-nocturne-accent-text",
  offered: "bg-nocturne-gold",
  selected: "bg-nocturne-success",
  rejected: "bg-nocturne-error",
};

export function JobHealthWidget({ jobs }: { jobs: JobHealth[] }) {
  return (
    <Widget
      title="Job health"
      description="Every published job, by stage"
      action={<MoreLink href="/admin/jobs">All jobs</MoreLink>}
    >
      {jobs.length === 0 ? (
        <EmptyState title="No published jobs" body="Publish a job to see how its pipeline is doing." />
      ) : (
        <ul className="border-t border-nocturne-border">
          {jobs.map((job) => (
            <li key={job.id} className="border-b border-nocturne-border last:border-b-0">
              <Link
                href={`/admin/jobs/${job.id}/applications`}
                className="flex flex-col gap-2.5 px-4 py-3.5 transition-colors hover:bg-nocturne-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-nocturne-accent sm:px-5.5"
              >
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="min-w-0 truncate text-sm font-bold text-nocturne-ink">{job.title}</span>
                  <span className="shrink-0 text-xs text-nocturne-ink-muted">
                    <span className="nocturne-mono font-semibold text-nocturne-ink">{job.total}</span>{" "}
                    {job.total === 1 ? "applicant" : "applicants"}
                    {job.daysOpen != null && (
                      <>
                        {" · open "}
                        <span className="nocturne-mono font-semibold text-nocturne-ink">{job.daysOpen}</span>{" "}
                        {job.daysOpen === 1 ? "day" : "days"}
                      </>
                    )}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {job.stages.map((stage) => (
                    <span
                      key={stage.status}
                      className={cn(
                        "inline-flex h-6.5 items-center gap-1.5 rounded-nocturne-pill bg-nocturne-raised px-2.5 text-xs text-nocturne-ink-muted",
                        stage.count === 0 && "opacity-60",
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", STAGE_DOT[stage.status])} aria-hidden />
                      {applicationStatusLabel(stage.status)}
                      <span className="nocturne-mono font-semibold text-nocturne-ink">{stage.count}</span>
                    </span>
                  ))}
                </span>
                {job.warnings.length > 0 && (
                  <span className="flex flex-wrap gap-1.5">
                    {job.warnings.map((w) => (
                      <span
                        key={w.kind}
                        className={cn(
                          "inline-flex h-6.5 items-center gap-1.5 rounded-nocturne-pill px-2.5 text-xs font-semibold",
                          w.kind === "deadline_passed"
                            ? "bg-nocturne-error-tint text-nocturne-error"
                            : "bg-nocturne-gold-tint text-nocturne-gold",
                        )}
                      >
                        <AlertTriangle className="size-3.5" aria-hidden />
                        {w.label}
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Skeletons                                                          */
/* ------------------------------------------------------------------ */

export function DashboardListSkeleton({ title, rows = 4 }: { title: string; rows?: number }) {
  return (
    <Widget title={title}>
      <ul className="border-t border-nocturne-border" aria-hidden>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-nocturne-border px-4 py-3.5 last:border-b-0 sm:px-5.5">
            <span className="flex flex-1 flex-col gap-2">
              <Bone className="h-3.5 w-36" />
              <Bone className="h-3 w-24" />
            </span>
            <Bone className="h-3 w-12" />
          </li>
        ))}
      </ul>
      <p className="sr-only" role="status">
        Loading {title.toLowerCase()}…
      </p>
    </Widget>
  );
}
