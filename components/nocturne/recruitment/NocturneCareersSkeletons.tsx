"use client";

import { usePathname } from "next/navigation";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import {
  CareersBand,
  CareersFooter,
  JobsHero,
  careersContainer,
  glowPanelClass,
  heroGlowClass,
  panelClass,
  softPanelClass,
} from "@/components/nocturne/recruitment/careersUi";
import { cn } from "@/lib/utils/cn";

/**
 * Loading placeholders for the Nocturne careers pages, shown by the route
 * loading files while the server fetches jobs. Each mirrors the real
 * page's layout (same frame, hero, cards and spacing) so content lands in
 * place instead of shifting.
 */

function Bone({ className }: { className?: string }) {
  // Pill by default; a bone that sets its own corners keeps them.
  const shape = className?.includes("rounded-") ? undefined : "rounded-nocturne-pill";
  return <div aria-hidden className={cn("nocturne-skeleton", shape, className)} />;
}

function LoadingStatus({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

/** Same size as a job card (desktop) / compact card (phone). */
function JobCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex flex-col rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-4 py-3.5 shadow-nocturne-rest sm:px-6.5 sm:py-6"
    >
      <div className="flex items-center justify-between gap-3 sm:min-h-9.5">
        <Bone className="h-3 w-24" />
        <Bone className="size-9.5 rounded-full max-sm:hidden" />
      </div>
      <Bone className="mt-2.5 h-5 w-4/5 sm:mt-3.5 sm:h-6" />
      <div className="mt-4 flex gap-2 max-sm:hidden">
        <Bone className="h-7.5 w-28" />
        <Bone className="h-7.5 w-22" />
        <Bone className="h-7.5 w-20" />
      </div>
      <Bone className="mt-2 h-3 w-40 sm:hidden" />
      <div className="mt-5 flex items-center justify-between max-sm:hidden">
        <Bone className="h-3 w-32" />
        <Bone className="h-3 w-16" />
      </div>
    </div>
  );
}

export function NocturneJobsListSkeleton() {
  return (
    <NocturneCareersFrame skeleton>
      <JobsHero
        search={
          <div
            aria-hidden
            className="h-[6.4375rem] max-w-[42.5rem] rounded-nocturne-card bg-nocturne-card shadow-nocturne-lift ring-1 ring-nocturne-border ring-inset sm:h-14"
          />
        }
        stats={
          <div aria-hidden className="grid grid-cols-3 gap-2 sm:gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2.5 rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-3 py-3 shadow-nocturne-rest sm:px-4.5 sm:py-4.5"
              >
                <Bone className="h-7 w-9 rounded-nocturne-control sm:h-10 sm:w-11" />
                <Bone className="h-3 w-16" />
              </div>
            ))}
          </div>
        }
      />
      <main className={`${careersContainer} pt-4 pb-16 sm:pt-6 sm:pb-20`} aria-busy="true">
        <LoadingStatus label="Loading open positions…" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-baseline gap-4">
            <h2 className="font-nocturne-display text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] text-nocturne-ink max-sm:text-[1.375rem]">
              Open positions
            </h2>
            <Bone className="h-3 w-20" />
          </div>
          <div aria-hidden className="flex gap-1.5">
            <Bone className="h-8.5 w-12" />
            <Bone className="h-8.5 w-28" />
            <Bone className="h-8.5 w-24" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <CareersFooter />
    </NocturneCareersFrame>
  );
}

function FactsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="size-8 shrink-0 rounded-nocturne-control" />
          <div className="flex-1">
            <Bone className="h-2.5 w-20" />
            <Bone className="mt-2 h-3.5 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main className={heroGlowClass} aria-busy="true">
      <LoadingStatus label="Loading position details…" />
      <div
        aria-hidden
        className={`${careersContainer} grid grid-cols-1 gap-7 pt-6 pb-16 sm:pt-9 sm:pb-24 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start tablet:gap-8`}
      >
        <div className="min-w-0">
          <Bone className="h-3.5 w-28" />
          <Bone className="mt-7 h-3 w-24" />
          <Bone className="mt-4 h-10 w-full max-w-lg rounded-nocturne-control sm:h-12" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Bone className="h-7.5 w-28" />
            <Bone className="h-7.5 w-24" />
            <Bone className="h-7.5 w-20" />
            <Bone className="h-7.5 w-24" />
          </div>
          <Bone className="mt-6 h-11 w-full rounded-nocturne-control tablet:hidden" />
          <div className={cn(panelClass, "mt-7 px-5 py-6 sm:px-7 sm:py-7")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mt-6 border-t border-nocturne-border pt-6 first:mt-0 first:border-t-0 first:pt-0">
                <Bone className="h-5 w-40" />
                <Bone className="mt-4 h-3.5 w-full" />
                <Bone className="mt-2.5 h-3.5 w-11/12" />
                <Bone className="mt-2.5 h-3.5 w-3/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className={cn(glowPanelClass, "px-5 py-5.5 sm:px-6")}>
            <Bone className="h-3 w-24" />
            <Bone className="mt-3 h-5.5 w-4/5" />
            <Bone className="mt-2.5 h-3 w-44" />
            <Bone className="mt-4 h-11 w-full rounded-nocturne-control" />
          </div>
          <div className={cn(panelClass, "px-5 py-5 sm:px-6")}>
            <Bone className="h-3 w-24" />
            <div className="mt-4">
              <FactsSkeleton rows={4} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ApplySkeleton() {
  return (
    <>
      <CareersBand>
        <div aria-hidden>
          <Bone className="h-3.5 w-40" />
          <Bone className="mt-7 h-3 w-36" />
          <Bone className="mt-4 h-9 w-full max-w-md rounded-nocturne-control sm:h-11" />
          <Bone className="mt-3.5 h-3.5 w-full max-w-sm" />
          <div className="mt-5 flex flex-wrap gap-2">
            <Bone className="h-8.5 w-32" />
            <Bone className="h-8.5 w-36" />
            <Bone className="h-8.5 w-24" />
          </div>
        </div>
      </CareersBand>
      <main className={`${careersContainer} pt-5 pb-16 sm:pb-24`} aria-busy="true">
        <LoadingStatus label="Loading application form…" />
        <div
          aria-hidden
          className="grid grid-cols-1 gap-5 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start tablet:gap-6"
        >
          <div className={cn(panelClass, "p-5 sm:px-6.5 sm:py-6.5")}>
            <div className="flex items-center gap-2.5">
              <Bone className="size-7 shrink-0" />
              <Bone className="h-5 w-32" />
            </div>
            <Bone className="mt-3 h-3 w-64 max-w-full sm:ml-9.5" />
            <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <Bone className="h-3 w-24" />
                  <Bone className="mt-2.5 h-11 w-full rounded-nocturne-control" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <div className={cn(panelClass, "p-5 sm:px-6 sm:py-5.5")}>
              <Bone className="h-3 w-32" />
              <Bone className="mt-3 h-5.5 w-4/5" />
              <Bone className="mt-2.5 h-3.5 w-1/3" />
              <div className="mt-4 border-t border-nocturne-border pt-4">
                <FactsSkeleton rows={3} />
              </div>
            </div>
            <div className={cn(softPanelClass, "h-40")} />
          </div>
        </div>
      </main>
    </>
  );
}

/** Used for the job detail and apply pages; picks the layout from the URL being loaded. */
export function NocturneJobDetailSkeleton() {
  const pathname = usePathname();
  return (
    <NocturneCareersFrame skeleton>{pathname.endsWith("/apply") ? <ApplySkeleton /> : <DetailSkeleton />}</NocturneCareersFrame>
  );
}
