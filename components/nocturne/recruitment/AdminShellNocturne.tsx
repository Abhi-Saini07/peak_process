"use client";

import { useAdminSignOut } from "@/hooks/recruitment/useAdminSignOut";
import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/* Small pieces shared by every Nocturne HR admin screen.               */
/* ------------------------------------------------------------------ */

/** White "work" panel: hairline border, 12px corners, low shadow. */
export const adminPanelClass = "rounded-nocturne-card border border-nocturne-border bg-nocturne-card shadow-nocturne-rest";

/** Serif page title + optional muted lead, as on the Ledger app screens. */
export function AdminPageHeading({
  title,
  lead,
  action,
  className,
}: {
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-nocturne-display text-[2rem] leading-[1.1] font-semibold tracking-[-0.015em] text-balance text-nocturne-ink sm:text-[2.5rem]">
          {title}
        </h1>
        {lead && <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-nocturne-ink-muted sm:text-base">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const JOB_STATUS_PILL: Record<string, string> = {
  published: "bg-nocturne-accent-tint text-nocturne-accent-text",
  draft: "bg-nocturne-gold-tint text-nocturne-gold",
  closed: "bg-nocturne-surface-2 text-nocturne-ink-muted",
};

const APPLICATION_STATUS_PILL: Record<string, string> = {
  applied: "bg-nocturne-surface-2 text-nocturne-ink-muted",
  under_review: "bg-nocturne-gold-tint text-nocturne-gold",
  shortlisted: "bg-nocturne-gold-tint text-nocturne-gold",
  interview: "bg-nocturne-gold-tint text-nocturne-gold",
  selected: "bg-nocturne-success-tint text-nocturne-success",
  rejected: "bg-nocturne-error-tint text-nocturne-error",
};

/** Status pill with a leading dot (published = pine, draft = brass, closed = neutral). */
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
        "inline-flex h-6.5 items-center gap-1.5 rounded-nocturne-pill px-2.5 text-xs font-bold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <span className="size-1.75 shrink-0 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** Team / department pill (pine text on sage). */
export function TeamPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center truncate rounded-nocturne-pill bg-nocturne-surface px-2.5 py-1 text-xs font-bold text-nocturne-accent-text">
      {children}
    </span>
  );
}

/** Keyboard hint shown inside search boxes. */
export function KbdHint({ children }: { children: ReactNode }) {
  return (
    <kbd className="pointer-events-none rounded-[5px] border border-nocturne-border-strong/60 px-1.5 font-nocturne-mono text-xs text-nocturne-ink-muted">
      {children}
    </kbd>
  );
}

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
      <div className="mx-auto w-full max-w-[80rem] px-4 pt-4 pb-12 sm:px-8 sm:pt-6 lg:px-11 lg:pt-7.5">
        {/* Slim Ledger top row: where you are on the left, who you are on the right. */}
        <div className="mb-5 flex min-h-9 items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[0.8125rem] text-nocturne-ink-muted">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 && (
                      <li aria-hidden className="text-nocturne-ink-faint">
                        /
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

          <div className="flex shrink-0 items-center gap-3 text-[0.8125rem]">
            <span className="hidden text-nocturne-ink-muted sm:inline">
              Signed in as <span className="font-semibold text-nocturne-ink">{adminName}</span>
            </span>
            <span className="hidden h-4 w-px bg-nocturne-border sm:block" aria-hidden />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-nocturne-control px-1 py-1 font-semibold text-nocturne-ink-muted transition-colors hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
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
