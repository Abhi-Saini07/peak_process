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
import { NocturneStepTimeline } from "./NocturneStepTimeline";

/* ------------------------------------------------------------------ */
/* Page chrome shared by the onboarding steps, dashboard and completion */
/* screen (Nocturne: progress bar + stepper on top, work in cards).     */
/* ------------------------------------------------------------------ */

/** Slim meta row for app screens: a quiet breadcrumb (desktop only — below
 *  the tablet breakpoint the shell's compact header already says where you
 *  are) and an optional status on the right that stays visible. */
export function NocturnePageBar({ trail, right }: { trail: string[]; right?: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-4 min-h-6 items-center justify-end gap-4 tablet:mb-5 tablet:flex tablet:justify-between",
        right ? "flex" : "hidden",
      )}
    >
      <nav aria-label="Breadcrumb" className="hidden min-w-0 tablet:block">
        <ol className="flex items-center gap-1.5 text-xs font-medium text-nocturne-ink-faint">
          {trail.map((crumb, i) => {
            const isLast = i === trail.length - 1;
            return (
              <Fragment key={crumb}>
                <li className={cn("truncate", isLast && "text-nocturne-ink-muted")} aria-current={isLast ? "page" : undefined}>
                  {crumb}
                </li>
                {!isLast && <li aria-hidden>/</li>}
              </Fragment>
            );
          })}
        </ol>
      </nav>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </div>
  );
}

/** Small uppercase label in accent text ("Step 2 of 7", "Next step"). */
export function NocturneEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs leading-snug font-bold tracking-[0.12em] text-nocturne-accent-text uppercase", className)}>
      {children}
    </p>
  );
}

/** Page-level Sora title (dashboard, completion). */
export const nocturnePageTitleClass =
  "font-nocturne-display mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.025em] text-balance text-nocturne-ink sm:text-[2.5rem]";

/** Sora title inside a focus card (step pages, welcome). */
export const nocturneCardTitleClass =
  "font-nocturne-display mt-2 text-[1.625rem] leading-[1.15] font-semibold tracking-[-0.022em] text-balance text-nocturne-ink sm:text-[2rem]";

export const nocturneLeadClass = "mt-2 max-w-[47.5rem] text-[0.9375rem] leading-relaxed text-nocturne-ink-muted";

/** Card surface: white with hairline + soft shadow in light, layered navy
 *  in dark. */
export const nocturneCardClass =
  "rounded-nocturne-card border border-nocturne-border bg-nocturne-card shadow-nocturne-rest";

/** The card that holds the next action: accent-tinted edge, a faint accent
 *  wash at the top and the Nocturne glow. */
export const nocturneFocusCardClass =
  "rounded-nocturne-card border border-nocturne-accent/30 bg-nocturne-card bg-linear-to-b from-nocturne-accent-tint/70 to-nocturne-card to-40% shadow-nocturne-glow";

/** Work panel that holds a step's form. */
export const nocturneWorkPanelClass = cn(nocturneFocusCardClass, "px-4.5 py-5 sm:px-6.5 sm:py-6");

/** Side panel ("Before you begin", "Your privacy", "Next steps"…). */
export const nocturneHelpPanelClass = cn(nocturneCardClass, "px-4.5 py-5 sm:px-6 sm:py-5.5");

/** Status chips: success = mint, needs attention = amber. */
export const nocturnePillClass = {
  success: "bg-nocturne-success-tint text-nocturne-success",
  attention: "bg-nocturne-gold-tint text-nocturne-gold",
  neutral: "bg-nocturne-raised text-nocturne-ink-muted",
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

/** Slim accent progress bar with a soft glow on the filled part. */
export function NocturneProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn("h-2 w-full overflow-hidden rounded-nocturne-pill bg-nocturne-surface-2", className)}
    >
      <div
        className="h-full rounded-nocturne-pill bg-linear-to-r from-nocturne-accent/60 to-nocturne-accent shadow-[0_0_16px_color-mix(in_oklab,var(--color-nocturne-accent)_55%,transparent)] transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** Progress bar + horizontal numbered stepper, the header of every
 *  onboarding screen. Hidden below the tablet breakpoint by default, where
 *  the shell's sticky header already shows step and percent. */
export function NocturneProgressHeader({ className, mobile = false }: { className?: string; mobile?: boolean }) {
  const percent = useCompletionPercent();
  return (
    <div className={cn(mobile ? "block" : "hidden tablet:block", className)}>
      <NocturneProgressBar percent={percent} />
      <NocturneStepTimeline variant="stepper" className="mt-3.5" />
    </div>
  );
}

/** Side help panel for a step's `aside` ("Your privacy" and similar). Keep
 *  the copy short and factual. */
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
    <aside className={cn(nocturneHelpPanelClass, "xl:sticky xl:top-10")}>
      <div className="flex items-start gap-3.5">
        {Icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-nocturne-control bg-nocturne-accent-tint text-nocturne-accent-text">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] leading-snug font-bold text-nocturne-ink">{title}</h2>
          <div className="mt-1 text-[0.8125rem] leading-relaxed text-nocturne-ink-muted">{children}</div>
        </div>
      </div>
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
  /** Optional help panel beside the form (desktop) / below it (mobile). */
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
  const showBack = !hideBack && backSlug;

  return (
    <div>
      <NocturneProgressHeader className="mb-7" />

      <div
        className={cn(
          "grid grid-cols-1 items-start gap-4",
          aside && "xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]",
        )}
      >
        <section aria-labelledby={`nocturne-step-${stepId}`} className={nocturneWorkPanelClass}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <NocturneEyebrow>
              Step {index + 1} of {stepRegistry.length}
            </NocturneEyebrow>
            <NocturneSaveIndicator idleLabel="Saves automatically" />
          </div>
          <h1 id={`nocturne-step-${stepId}`} className={nocturneCardTitleClass}>
            {title}
          </h1>
          <p className={nocturneLeadClass}>{description ?? step.description}</p>

          <div className="mt-6">{children}</div>

          <div
            className={cn(
              "mt-5 flex flex-wrap items-center gap-3 border-t border-nocturne-border pt-5",
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
        </section>

        {aside}
      </div>
    </div>
  );
}
