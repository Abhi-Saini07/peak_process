import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requestNow } from "@/lib/server/clock";
import { getDashboardKpis, getJobHealth, getNeedsAttention, getNewToReview } from "@/lib/server/dashboardRepository";
import { AdminPageHeading } from "@/components/nocturne/recruitment/AdminShellNocturne";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import {
  DashboardKpiStrip,
  DashboardKpiStripSkeleton,
  DashboardListSkeleton,
  JobHealthWidget,
  NeedsAttentionWidget,
  NewToReviewWidget,
} from "@/components/nocturne/recruitment/AdminDashboardNocturne";

export const metadata: Metadata = { title: "Dashboard | Peak Process Partners" };

async function Kpis({ now }: { now: number }) {
  return <DashboardKpiStrip kpis={await getDashboardKpis(now)} />;
}

async function NewToReview({ now }: { now: number }) {
  const { items, total } = await getNewToReview();
  return <NewToReviewWidget items={items} total={total} now={now} />;
}

async function NeedsAttention({ now }: { now: number }) {
  const { items, total } = await getNeedsAttention(now);
  return <NeedsAttentionWidget items={items} total={total} />;
}

async function JobHealth({ now }: { now: number }) {
  return <JobHealthWidget jobs={await getJobHealth(now)} />;
}

/** Recruiter dashboard: each widget streams in on its own behind a skeleton. */
export default function AdminDashboardPage() {
  const now = requestNow();
  return (
    <div>
      <AdminPageHeading
        eyebrow="Recruitment · Dashboard"
        title="Dashboard"
        lead="What needs you today across published jobs."
        action={
          <Link href="/admin/jobs/new" className={nocturneButtonVariants({ variant: "primary" })}>
            Post a job
          </Link>
        }
      />
      <div className="mt-7 flex flex-col gap-4">
        <Suspense fallback={<DashboardKpiStripSkeleton />}>
          <Kpis now={now} />
        </Suspense>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Suspense fallback={<DashboardListSkeleton title="New to review" />}>
            <NewToReview now={now} />
          </Suspense>
          <Suspense fallback={<DashboardListSkeleton title="Needs attention" />}>
            <NeedsAttention now={now} />
          </Suspense>
        </div>
        <Suspense fallback={<DashboardListSkeleton title="Job health" rows={3} />}>
          <JobHealth now={now} />
        </Suspense>
      </div>
    </div>
  );
}
