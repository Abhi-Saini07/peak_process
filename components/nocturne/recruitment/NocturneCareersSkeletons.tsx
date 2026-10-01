"use client";

import { usePathname } from "next/navigation";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import {
  CareersBand,
  CareersFooter,
  JobsHero,
  careersContainer,
  panelClass,
  softPanelClass,
} from "@/components/nocturne/recruitment/careersUi";
import { cn } from "@/lib/utils/cn";

/**
 * Loading placeholders for the Nocturne careers pages, shown by the route
 * loading files while the server fetches jobs. Each mirrors the real
 * page's layout (same frame, container, panels, table rows and spacing)
 * so content lands in place instead of shifting.
 */

function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("nocturne-skeleton rounded-nocturne-pill", className)} />;
}

function LoadingStatus({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}

/** Same size as a jobs table row (desktop) / stacked row card (phone). */
function JobRowSkeleton() {
  return (
    <div
      aria-hidden
      className="flex items-center gap-3 max-tablet:justify-between max-tablet:rounded-nocturne-card max-tablet:border max-tablet:border-nocturne-border max-tablet:bg-nocturne-card max-tablet:min-h-[4.5rem] max-tablet:p-3.5 max-tablet:shadow-nocturne-rest tablet:grid tablet:h-[4.625rem] tablet:grid-cols-[34%_1fr_1fr_1fr_13rem] tablet:gap-0 tablet:border-b tablet:border-nocturne-border tablet:last:border-b-0"
    >
      <div className="min-w-0 tablet:pr-4 tablet:pl-5">
        <Bone className="h-4 w-44 max-w-full" />
        <Bone className="mt-2 h-3 w-28" />
      </div>
      <div className="px-4 max-tablet:hidden">
        <Bone className="h-5.5 w-24" />
      </div>
      <div className="px-4 max-tablet:hidden">
        <Bone className="h-3.5 w-24" />
      </div>
      <div className="tablet:px-4">
        <Bone className="h-5.5 w-18" />
      </div>
      <div className="flex items-center justify-end gap-5 pr-5 pl-4 max-tablet:hidden">
        <Bone className="h-9 w-24 rounded-nocturne-control" />
        <Bone className="h-3.5 w-18" />
      </div>
    </div>
  );
}

export function NocturneJobsListSkeleton() {
  return (
    <NocturneCareersFrame skeleton>
      <JobsHero
        search={<div aria-hidden className="h-12 max-w-[29.5rem] rounded-nocturne-control bg-nocturne-card shadow-nocturne-lift" />}
        teams={
          <div aria-hidden className="grid grid-cols-2 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex h-[4.7rem] flex-col justify-center gap-2 rounded-nocturne-card bg-nocturne-card px-4 shadow-nocturne-rest">
                <Bone className="h-4 w-24" />
                <Bone className="h-3 w-12" />
              </div>
            ))}
          </div>
        }
      />
      <main className={`${careersContainer} pt-5 pb-16 sm:pt-8 sm:pb-20`} aria-busy="true">
        <LoadingStatus label="Loading open positions…" />
        <div aria-hidden className="mb-4 flex gap-1.5 sm:hidden">
          <Bone className="h-8 w-14" />
          <Bone className="h-8 w-28" />
          <Bone className="h-8 w-24" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-baseline gap-4">
            <h2 className="font-nocturne-display text-[1.75rem] leading-tight font-semibold tracking-[-0.01em] text-nocturne-ink max-sm:text-2xl">
              Open positions
            </h2>
            <Bone className="h-3 w-20" />
          </div>
          <div aria-hidden className="h-9 rounded-nocturne-control border border-nocturne-border bg-nocturne-card sm:w-48" />
        </div>
        <div className="mt-4 max-tablet:flex max-tablet:flex-col max-tablet:gap-2 tablet:overflow-hidden tablet:rounded-nocturne-card tablet:border tablet:border-nocturne-border tablet:bg-nocturne-card tablet:shadow-nocturne-rest">
          <div aria-hidden className="h-[2.594rem] border-b border-nocturne-border bg-nocturne-table-head max-tablet:hidden" />
          {[0, 1, 2, 3].map((i) => (
            <JobRowSkeleton key={i} />
          ))}
        </div>
      </main>
      <CareersFooter />
    </NocturneCareersFrame>
  );
}

function FactsSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-2.5">
          <Bone className="size-4 shrink-0" />
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
    <main className={`${careersContainer} pt-6 pb-16 sm:pt-7 sm:pb-24`} aria-busy="true">
      <LoadingStatus label="Loading position details…" />
      <div aria-hidden className="grid grid-cols-1 gap-7 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start">
        <div className="min-w-0">
          <Bone className="h-3.5 w-28" />
          <Bone className="mt-5 h-3 w-24" />
          <Bone className="mt-3 h-10 w-full max-w-lg sm:h-12" />
          <div className="mt-4 flex flex-wrap gap-5">
            <Bone className="h-4 w-24" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-20" />
            <Bone className="h-4 w-24" />
          </div>
          <div className={cn(panelClass, "mt-6 px-5 py-6 sm:px-6")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="mt-7 first:mt-0">
                <Bone className="h-5 w-40" />
                <Bone className="mt-4 h-3.5 w-full" />
                <Bone className="mt-2.5 h-3.5 w-11/12" />
                <Bone className="mt-2.5 h-3.5 w-3/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className={cn(softPanelClass, "px-5 py-5 sm:px-6")}>
            <Bone className="h-5.5 w-28" />
            <Bone className="mt-2.5 h-3 w-44" />
            <Bone className="mt-4 h-11 w-full rounded-nocturne-control" />
          </div>
          <div className={cn(panelClass, "px-5 py-5 sm:px-6")}>
            <FactsSkeleton rows={4} />
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
          <Bone className="mt-3.5 h-9 w-full max-w-md sm:h-10" />
          <Bone className="mt-3 h-3.5 w-full max-w-sm" />
        </div>
      </CareersBand>
      <main className={`${careersContainer} pt-5 pb-16 sm:pt-6 sm:pb-24`} aria-busy="true">
        <LoadingStatus label="Loading application form…" />
        <div aria-hidden className="grid grid-cols-1 gap-5 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start">
          <div className={cn(panelClass, "p-5 sm:px-6 sm:py-6")}>
            <div className="flex items-center gap-2.5">
              <Bone className="size-6.5 shrink-0" />
              <Bone className="h-5 w-32" />
            </div>
            <Bone className="mt-3 h-3 w-64 max-w-full" />
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
            <div className={cn(panelClass, "p-5 sm:px-6")}>
              <Bone className="h-3 w-32" />
              <Bone className="mt-3 h-6 w-4/5" />
              <Bone className="mt-2 h-3.5 w-1/2" />
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
