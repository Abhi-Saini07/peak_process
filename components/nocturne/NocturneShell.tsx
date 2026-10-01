"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useCompletionPercent } from "@/lib/store/selectors";
import { getStepBySlug, getStepIndex, stepRegistry } from "@/lib/onboarding/steps.config";

function NocturneShellSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none">
      <div className="hidden tablet:block">
        <div className="h-2 rounded-nocturne-pill bg-nocturne-skeleton" />
        <div className="mt-4 grid grid-cols-7 gap-1">
          {stepRegistry.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className="size-7.5 rounded-full bg-nocturne-skeleton" />
              <div className="h-2.5 w-16 rounded bg-nocturne-skeleton" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-0 grid grid-cols-1 gap-4 tablet:mt-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="h-80 rounded-nocturne-card bg-nocturne-skeleton" />
        <div className="hidden h-44 rounded-nocturne-card bg-nocturne-skeleton xl:block" />
      </div>
    </div>
  );
}

export function NocturneShell({ children }: { children: ReactNode }) {
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);
  const percent = useCompletionPercent();
  const pathname = usePathname();
  const viewing = getStepBySlug(pathname.split("/").filter(Boolean)[1] ?? "");

  return (
    <div className="min-h-screen bg-nocturne-bg font-nocturne-sans text-nocturne-ink">
      {/* Below the tablet breakpoint only: on desktop the step list lives in
          the app sidebar and the page header carries the bar + stepper, so
          this sticky bar only says where you are. */}
      <header className="sticky top-0 z-20 border-b border-nocturne-border bg-nocturne-side/90 backdrop-blur-md tablet:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <p className="text-[0.6875rem] font-bold tracking-[0.12em] text-nocturne-accent-text uppercase">
            {viewing ? viewing.shortLabel : "Onboarding"}
          </p>
          <p className="font-nocturne-mono text-xs font-medium text-nocturne-ink-muted">
            {viewing ? (
              <>
                <span className="sr-only">Step </span>
                {getStepIndex(viewing.id) + 1} / {stepRegistry.length}
                <span aria-hidden className="text-nocturne-ink-faint"> · </span>
                <span className="sr-only">, </span>
              </>
            ) : null}
            <span className="font-semibold text-nocturne-accent-text">{percent}%</span>
            <span className="sr-only"> complete</span>
          </p>
        </div>
        <div aria-hidden className="h-[3px] bg-nocturne-surface-2">
          <div
            className="h-full rounded-r-full bg-nocturne-accent transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[68rem] px-4 py-5 sm:px-8 sm:py-8 tablet:px-12 tablet:py-10">
        {hasHydrated ? children : <NocturneShellSkeleton />}
      </main>
    </div>
  );
}
