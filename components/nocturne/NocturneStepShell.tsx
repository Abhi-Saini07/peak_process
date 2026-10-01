"use client";

import { Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getAdjacentSlug, getStepById, getStepIndex, stepRegistry } from "@/lib/onboarding/steps.config";
import { useCompletionPercent } from "@/lib/store/selectors";
import type { StepId } from "@/types/onboarding";
import { NocturneButton } from "./ui/NocturneButton";
import { NocturneSaveIndicator } from "./NocturneSaveIndicator";

/* ------------------------------------------------------------------ */
/* Page chrome shared by the onboarding steps, dashboard and completion */
/* screen (Ledger structure: breadcrumbs + status, then the heading).   */
/* ------------------------------------------------------------------ */

/** Breadcrumb row at the top of app screens. The trail is desktop-only —
 *  below the tablet breakpoint the shell's compact header already says
 *  where you are — while `right` (save status) stays visible. */
export function NocturnePageBar({ trail, right }: { trail: string[]; right?: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-5 min-h-6 items-center justify-end gap-4 tablet:mb-6 tablet:flex tablet:min-h-9 tablet:justify-between",
        right ? "flex" : "hidden",
      )}
    >
      <nav aria-label="Breadcrumb" className="hidden min-w-0 tablet:block">
        <ol className="flex items-center gap-1 text-[0.8125rem] text-nocturne-ink-muted">
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <Fragment key={crumb}>
                <li
                  className={cn("truncate", isLast && "font-semibold text-nocturne-ink")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb}
                </li>
                {!isLast && (
                  <li aria-hidden className="text-nocturne-ink-faint">
                    /
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </div>
  );
}

export function NocturneEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("nocturne-type-eyebrow font-bold text-nocturne-accent-text", className)}>{children}</p>
  );
}

export const nocturnePageTitleClass =
  "font-nocturne-display mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.015em] text-balance text-nocturne-ink sm:text-[2.5rem]";

export const nocturneLeadClass = "mt-2.5 max-w-[47.5rem] text-[0.9375rem] leading-relaxed text-nocturne-ink-muted sm:text-base";

/** White work panel (hairline border, 12px corners). Below `sm` it drops
 *  the frame so phone forms use the full width, as in the mobile mockup. */
export const nocturneWorkPanelClass =
  "sm:rounded-nocturne-card sm:border sm:border-nocturne-border sm:bg-nocturne-card sm:px-6 sm:py-5.5 sm:shadow-nocturne-rest";

/** Sage guidance panel ("Before you begin", "Why we ask"…). */
export const nocturneHelpPanelClass = "rounded-nocturne-card bg-nocturne-surface px-5 py-5 sm:px-6 sm:py-5.5";

/** Status pills: success = pine tint, needs attention = brass tint. */
export const nocturnePillClass = {
  success: "bg-nocturne-success-tint text-nocturne-success",
  attention: "bg-nocturne-gold-tint text-nocturne-gold",
  neutral: "bg-nocturne-surface-2/70 text-nocturne-ink-muted",
  error: "bg-nocturne-error-tint text-nocturne-error",
} as const;

export function NocturnePill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof nocturnePillClass;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-nocturne-pill px-2.5 text-xs font-bold whitespace-nowrap",
        nocturnePillClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Slim overall-progress bar with the mono percentage above it. */
export function NocturneProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("grid justify-items-end gap-2", className)}>
      <span className="font-nocturne-mono text-sm font-semibold text-nocturne-accent-text">{percent}%</span>
      <div
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-full overflow-hidden rounded-nocturne-pill bg-nocturne-surface-2"
      >
        <div
          className="h-full rounded-nocturne-pill bg-nocturne-accent transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Sage help panel for a step's `aside` ("Why we ask" and similar). Keep the
 *  copy short and factual. */
export function NocturneHelpPanel({
  icon: Icon,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className={cn(nocturneHelpPanelClass, "order-first xl:order-none")}>
      {Icon && (
        <span className="mb-3.5 hidden size-11 items-center justify-center sm:flex rounded-nocturne-card bg-nocturne-card text-nocturne-accent-text">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <h2 className="font-nocturne-display text-[1.1875rem] leading-snug font-semibold text-nocturne-ink">{title}</h2>
      <div className="mt-1 text-[0.8125rem] leading-relaxed text-nocturne-ink-muted">{children}</div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Step shell                                                           */
/* ------------------------------------------------------------------ */

interface NocturneStepShellProps {
  stepId: StepId;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isSubmitting?: boolean;
  hideBack?: boolean;
  /** Optional sage help panel beside the form (desktop) / below it (mobile). */
  aside?: ReactNode;
}

export function NocturneStepShell({
  stepId,
  title,
  description,
  children,
  onContinue,
  continueLabel = "Save & continue",
  continueDisabled,
  isSubmitting,
  hideBack,
  aside,
}: NocturneStepShellProps) {
  const router = useRouter();
  const backSlug = getAdjacentSlug(stepId, -1);
  const index = getStepIndex(stepId);
  const step = getStepById(stepId);
  const percent = useCompletionPercent();
  const showBack = !hideBack && backSlug;

  return (
    <div>
      <NocturnePageBar
        trail={["Onboarding", step.label]}
        right={<NocturneSaveIndicator idleLabel="Saves automatically" />}
      />

      <div className="flex flex-col gap-5 tablet:flex-row tablet:items-end tablet:justify-between tablet:gap-10">
        <div className="min-w-0">
          <NocturneEyebrow>
            Step {index + 1} of {stepRegistry.length}
          </NocturneEyebrow>
          <h1 className={nocturnePageTitleClass}>{title}</h1>
          <p className={nocturneLeadClass}>{description ?? step.description}</p>
        </div>
        {/* Below tablet the shell's sticky header carries the progress line. */}
        <NocturneProgressBar percent={percent} className="hidden w-60 shrink-0 pb-2 tablet:grid" />
      </div>

      <div
        className={cn(
          "mt-6 grid grid-cols-1 items-start gap-4",
          aside ? "xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" : "max-w-3xl",
        )}
      >
        <div className={nocturneWorkPanelClass}>
          {children}

          <div
            className={cn(
              "mt-6 flex flex-wrap items-center gap-3 border-t border-nocturne-border pt-4",
              showBack ? "justify-between" : "justify-end",
            )}
          >
            {showBack && (
              <NocturneButton variant="secondary" type="button" onClick={() => router.push(`/onboarding/${backSlug}`)}>
                <ArrowLeft className="size-4" aria-hidden /> Back
              </NocturneButton>
            )}
            <NocturneButton type="button" onClick={onContinue} isLoading={isSubmitting} disabled={continueDisabled} showArrow>
              {continueLabel}
            </NocturneButton>
          </div>
        </div>

        {aside}
      </div>
    </div>
  );
}
