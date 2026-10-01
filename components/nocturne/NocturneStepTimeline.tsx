"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stepRegistry } from "@/lib/onboarding/steps.config";
import { useStepStatuses } from "@/lib/store/selectors";
import type { StepStatus } from "@/types/onboarding";

/** Checklist wording. "blocked" = started but incomplete, after the step
 *  you're up to — it needs attention before you can submit. */
const STATUS_LABEL: Record<StepStatus, string> = {
  completed: "Complete",
  current: "Up next",
  blocked: "Incomplete",
  upcoming: "Not started",
};

const STATUS_TEXT_TONE: Record<StepStatus, string> = {
  completed: "text-nocturne-success",
  current: "text-nocturne-accent-text",
  blocked: "text-nocturne-gold",
  upcoming: "text-nocturne-ink-faint",
};

/** Nocturne step dot: done = mint check, current = accent fill with a soft
 *  halo, blocked = amber ring, to do = hairline ring. */
function StepDot({ status, index, size }: { status: StepStatus; index: number; size: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums transition-colors duration-200",
        size === "sm" ? "size-6.5 text-[0.6875rem] sm:size-7.5 sm:text-xs" : "size-6 text-[0.6875rem]",
        status === "completed" && "bg-nocturne-success text-nocturne-card",
        status === "current" && "bg-nocturne-accent text-nocturne-on-accent ring-4 ring-nocturne-accent/20 sm:ring-[5px]",
        status === "blocked" && "bg-nocturne-card text-nocturne-gold ring-[1.5px] ring-nocturne-gold ring-inset",
        status === "upcoming" &&
          "bg-nocturne-card text-nocturne-ink-muted ring-[1.5px] ring-nocturne-border-strong/60 ring-inset",
      )}
    >
      {status === "completed" ? <Check className="size-3 sm:size-3.5" strokeWidth={3} /> : index + 1}
    </span>
  );
}

interface NocturneStepTimelineProps {
  /** "stepper": horizontal numbered stepper for page headers (labels from `sm`).
   *  "trail": compact dots joined by lines. "list": vertical checklist. */
  variant?: "stepper" | "trail" | "list";
  className?: string;
}

export function NocturneStepTimeline({ variant = "list", className }: NocturneStepTimelineProps) {
  const statuses = useStepStatuses();
  const pathname = usePathname();

  if (variant === "stepper") {
    return (
      <nav aria-label="Onboarding steps" className={className}>
        <ol className="grid grid-cols-7 gap-1">
          {stepRegistry.map((step, index) => {
            const status = statuses[step.id] ?? "upcoming";
            const href = `/onboarding/${step.slug}`;
            const viewing = pathname === href;
            return (
              <li key={step.id} className="min-w-0">
                <Link
                  href={href}
                  aria-current={viewing ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${step.label}, ${STATUS_LABEL[status].toLowerCase()}`}
                  title={step.label}
                  className="group flex flex-col items-center gap-2 rounded-nocturne-control px-1 py-1.5 text-center outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-nocturne-accent"
                >
                  <StepDot status={status} index={index} size="sm" />
                  <span
                    className={cn(
                      "hidden max-w-full text-xs leading-snug text-balance transition-colors duration-150 sm:block",
                      viewing
                        ? "font-bold text-nocturne-ink"
                        : status === "current"
                          ? "font-semibold text-nocturne-ink"
                          : status === "completed"
                            ? "text-nocturne-ink-muted group-hover:text-nocturne-ink"
                            : "text-nocturne-ink-faint group-hover:text-nocturne-ink",
                    )}
                  >
                    {step.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  if (variant === "trail") {
    return (
      <nav aria-label="Onboarding steps" className={cn("flex w-full items-center", className)}>
        {stepRegistry.map((step, index) => {
          const status = statuses[step.id];
          const isLast = index === stepRegistry.length - 1;
          const href = `/onboarding/${step.slug}`;
          return (
            <div key={step.id} className={cn("flex items-center", !isLast && "flex-1")}>
              <Link
                href={href}
                aria-current={pathname === href ? "step" : undefined}
                aria-label={`${step.shortLabel}: ${STATUS_LABEL[status]}`}
                title={step.shortLabel}
                className="rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
              >
                <StepDot status={status} index={index} size="sm" />
              </Link>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn("h-px flex-1", status === "completed" ? "bg-nocturne-success/50" : "bg-nocturne-border")}
                />
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  /* "list": vertical checklist — hairline rows, status on the right, the
     step you're up to on a raised row. */
  return (
    <nav aria-label="Onboarding steps" className={className}>
      <ol>
        {stepRegistry.map((step, index) => {
          const status = statuses[step.id];
          return (
            <li key={step.id} className="border-b border-nocturne-border last:border-b-0">
              <Link
                href={`/onboarding/${step.slug}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-nocturne-accent sm:px-4.5",
                  status === "current" ? "bg-nocturne-raised" : "hover:bg-nocturne-raised",
                )}
              >
                <StepDot status={status} index={index} size="md" />
                <span className={cn("min-w-0 flex-1 truncate text-nocturne-ink", status === "current" && "font-bold")}>
                  {step.label}
                </span>
                <span className={cn("shrink-0 text-xs font-bold", STATUS_TEXT_TONE[status])}>
                  {STATUS_LABEL[status]}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
