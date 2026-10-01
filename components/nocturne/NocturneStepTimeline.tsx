"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stepRegistry } from "@/lib/onboarding/steps.config";
import { useStepStatuses } from "@/lib/store/selectors";
import type { StepStatus } from "@/types/onboarding";

/** Ledger checklist wording. "blocked" = started but incomplete, after the
 *  step you're up to — it needs attention before you can submit. */
const STATUS_LABEL: Record<StepStatus, string> = {
  completed: "Complete",
  current: "Up next",
  blocked: "Incomplete",
  upcoming: "Not started",
};

const STATUS_TEXT_TONE: Record<StepStatus, string> = {
  completed: "text-nocturne-success",
  current: "text-nocturne-gold",
  blocked: "rounded-nocturne-pill bg-nocturne-gold-tint px-2.5 py-0.5 text-nocturne-gold",
  upcoming: "text-nocturne-ink-faint",
};

function StepDot({ status, index, size }: { status: StepStatus; index: number; size: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-bold",
        size === "sm" ? "size-6 text-[10px] sm:size-7 sm:text-[11px]" : "size-6 text-xs",
        status === "completed" && "border-nocturne-accent bg-nocturne-accent text-nocturne-on-accent",
        status === "current" && "border-2 border-nocturne-accent bg-nocturne-card text-nocturne-accent-text",
        status === "blocked" && "border-nocturne-gold bg-nocturne-card text-nocturne-gold",
        status === "upcoming" && "border-nocturne-border-strong/60 bg-nocturne-card text-nocturne-ink-muted",
      )}
    >
      {status === "completed" ? <Check className="size-3" strokeWidth={3} /> : index + 1}
    </span>
  );
}

interface NocturneStepTimelineProps {
  variant?: "trail" | "list";
  className?: string;
}

export function NocturneStepTimeline({ variant = "list", className }: NocturneStepTimelineProps) {
  const statuses = useStepStatuses();
  const pathname = usePathname();

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
                  className={cn("h-px flex-1", status === "completed" ? "bg-nocturne-accent/40" : "bg-nocturne-border")}
                />
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  /* "list": the dashboard's Ledger checklist — hairline rows, status on the
     right, the step you're up to tinted sage. */
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
                  status === "current" ? "bg-nocturne-surface hover:bg-nocturne-surface-2/70" : "hover:bg-nocturne-table-head",
                )}
              >
                <StepDot status={status} index={index} size="md" />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    status === "current" ? "font-bold text-nocturne-ink" : "text-nocturne-ink",
                  )}
                >
                  {step.label}
                </span>
                <span className={cn("shrink-0 text-xs font-semibold", STATUS_TEXT_TONE[status])}>
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
