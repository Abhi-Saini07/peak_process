"use client";

import { useAdminSignOut } from "@/hooks/recruitment/useAdminSignOut";
import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/* Small pieces shared by every Nocturne HR admin screen.               */
/* ------------------------------------------------------------------ */

/** Nocturne card surface: hairline border, 14px corners, soft shadow (lifts off the cool page in light). */
export const adminPanelClass = "rounded-nocturne-card border border-nocturne-border bg-nocturne-card shadow-nocturne-rest";

/** Small uppercase label in accent text ("Recruitment · New job"). */
export const adminEyebrowClass = "nocturne-type-eyebrow text-nocturne-accent-text";

/** Card heading inside admin panels (Sora). */
export const adminCardTitleClass =
  "font-nocturne-display text-[1.0625rem] leading-snug font-semibold tracking-[-0.01em] text-nocturne-ink";

/** Uppercase column / field label used by tables and detail lists. */
export const adminLabelClass = "text-[0.6875rem] font-bold tracking-[0.1em] text-nocturne-ink-muted uppercase";

/** Page header: accent eyebrow, Sora title, optional muted lead; actions sit top-right on wide screens. */
export function AdminPageHeading({
  title,
  lead,
  action,
  eyebrow,
  actionClassName,
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
  /** Extra classes for the action slot (e.g. to show it only on wide screens). */
  actionClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className={adminEyebrowClass}>{eyebrow}</p>}
        <h1
          className={cn(
            "font-nocturne-display text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance break-words text-nocturne-ink sm:text-[2.5rem]",
            eyebrow && "mt-2",
          )}
        >
          {title}
        </h1>
        {lead && <p className="mt-2.5 max-w-3xl text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">{lead}</p>}
      </div>
      {action && <div className={cn("flex shrink-0 flex-wrap items-center gap-2.5", actionClassName)}>{action}</div>}
    </div>
  );
}

const JOB_STATUS_PILL: Record<string, string> = {
  published: "bg-nocturne-success-tint text-nocturne-success",
  draft: "bg-nocturne-gold-tint text-nocturne-gold",
  closed: "bg-nocturne-raised text-nocturne-ink-muted",
};

const APPLICATION_STATUS_PILL: Record<string, string> = {
  applied: "bg-nocturne-raised text-nocturne-ink-muted",
  under_review: "bg-nocturne-gold-tint text-nocturne-gold",
  shortlisted: "bg-nocturne-accent-tint text-nocturne-accent-text",
  interview: "bg-nocturne-accent-tint text-nocturne-accent-text",
  selected: "bg-nocturne-success-tint text-nocturne-success",
  rejected: "bg-nocturne-error-tint text-nocturne-error",
};

/** Status pill with a leading dot (published = mint, draft = amber, closed = neutral). */
export function StatusPill({
  kind,
  status,
  children,
  className,
}: {
  kind: "job" | "application";
  status: string;
  children: ReactNode;
  className?: string;
}) {
  const tone = (kind === "job" ? JOB_STATUS_PILL : APPLICATION_STATUS_PILL)[status] ?? JOB_STATUS_PILL.closed;
  return (
    <span
      className={cn(
        "inline-flex h-6.5 items-center gap-1.5 rounded-nocturne-pill px-2.5 text-xs font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** Team / department tag (raised chip, like the careers card meta tags). */
export function TeamPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6.5 max-w-full items-center truncate rounded-nocturne-pill bg-nocturne-raised px-2.5 text-xs font-semibold text-nocturne-ink">
      {children}
    </span>
  );
}

/** Keyboard hint shown inside search boxes. */
export function KbdHint({ children }: { children: ReactNode }) {
  return (
    <kbd className="pointer-events-none inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-[6px] border border-nocturne-border bg-nocturne-raised px-1.5 font-nocturne-mono text-[0.6875rem] text-nocturne-ink-muted">
      {children}
    </kbd>
  );
}

/** Search box shared by the admin lists (input on the page, accent ring + glow on focus). */
export const adminSearchInputClass =
  "h-10 w-full rounded-nocturne-control border border-nocturne-border-strong bg-nocturne-card pr-10 pl-10 text-sm text-nocturne-ink outline-none transition-[border-color,box-shadow] placeholder:text-nocturne-ink-faint hover:border-nocturne-ink-muted focus:border-nocturne-accent focus:shadow-nocturne-glow [&::-webkit-search-cancel-button]:hidden";

/* ------------------------------------------------------------------ */
/* Breadcrumbs — derived from the route, so pages don't pass them.    */
/* ------------------------------------------------------------------ */

interface Crumb {
  label: string;
  href?: string;
}

function crumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean); // ["admin", ...]
  const root: Crumb = { label: "Recruitment" };
  const postings: Crumb = { label: "Job postings", href: "/admin/jobs" };

  if (parts[1] === "jobs") {
    if (parts.length === 2) return [root, { label: "Job postings" }];
    if (parts[2] === "new") return [root, postings, { label: "New job" }];
    if (parts[3] === "applications") {
      return [root, postings, { label: "Edit job", href: `/admin/jobs/${parts[2]}` }, { label: "Applications" }];
    }
    return [root, postings, { label: "Edit job" }];
  }
  if (parts[1] === "applications") return [root, postings, { label: "Application" }];
  return [root];
}

export function AdminShellNocturne({ adminName, children }: { adminName: string; children: ReactNode }) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname ?? "");

  const handleLogout = useAdminSignOut();

  return (
    <div className="min-h-screen bg-nocturne-bg font-nocturne-ui text-nocturne-ink">
      <div className="mx-auto w-full max-w-[80rem] px-4 pt-4 pb-14 sm:px-8 sm:pt-6 lg:px-12 lg:pt-8">
        {/* Slim top row: where you are on the left, who you are on the right. */}
        <div className="mb-6 flex min-h-10 items-center justify-between gap-4 sm:mb-8">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.8125rem] font-medium text-nocturne-ink-muted">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 && (
                      <li aria-hidden className="text-nocturne-ink-faint">
                        <ChevronRight className="size-3.5" />
                      </li>
                    )}
                    <li className="min-w-0">
                      {last ? (
                        <span aria-current="page" className="font-semibold text-nocturne-ink">
                          {crumb.label}
                        </span>
                      ) : crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="rounded-sm transition-colors hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        crumb.label
                      )}
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </nav>

          <div className="flex shrink-0 items-center gap-2 text-[0.8125rem] sm:gap-3">
            <span className="hidden text-nocturne-ink-muted md:inline">
              Signed in as <span className="font-semibold text-nocturne-ink">{adminName}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-nocturne-pill border border-nocturne-border bg-nocturne-card px-3.5 font-semibold text-nocturne-ink-muted shadow-nocturne-rest transition-colors hover:border-nocturne-border-strong hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
            >
              <LogOut className="size-3.5" aria-hidden />
              Log out
            </button>
          </div>
        </div>

        <main>{children}</main>
      </div>
    </div>
  );
}
