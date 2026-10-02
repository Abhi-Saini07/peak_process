import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ApplicationStatus } from "@/lib/recruitment/constants";
import { STAGE_WARNING_DAYS } from "@/lib/recruitment/board";
import {
  compareCounts,
  jobHealth,
  needsAttention,
  startOfMonthUTC,
  weekWindows,
  type JobHealth,
  type StuckApplication,
  type Trend,
} from "@/lib/recruitment/dashboard-metrics";

/** Everything on the dashboard is about published jobs only. */
const PUBLISHED_JOB: Prisma.JobApplicationWhereInput = { job: { status: "published" } };

const NON_TERMINAL: ApplicationStatus[] = ["applied", "under_review", "shortlisted", "interview"];

function todayUTC(now: number): Date {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function candidateName(c: { firstName: string; lastName: string }): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export type DashboardKpis = {
  openJobs: number;
  applicationsLast7: number;
  applicationsPrevious7: number;
  applicationsTrend: Trend;
  atInterview: number;
  selectedThisMonth: number;
};

export async function getDashboardKpis(now: number): Promise<DashboardKpis> {
  const weeks = weekWindows(now);
  const [openJobs, applicationsLast7, applicationsPrevious7, atInterview, selectedThisMonth] = await Promise.all([
    prisma.job.count({
      where: { status: "published", OR: [{ deadline: null }, { deadline: { gte: todayUTC(now) } }] },
    }),
    prisma.jobApplication.count({
      where: { ...PUBLISHED_JOB, appliedAt: { gte: weeks.current.from, lt: weeks.current.to } },
    }),
    prisma.jobApplication.count({
      where: { ...PUBLISHED_JOB, appliedAt: { gte: weeks.previous.from, lt: weeks.previous.to } },
    }),
    prisma.jobApplication.count({ where: { ...PUBLISHED_JOB, status: "interview" } }),
    prisma.jobApplication.count({
      where: { ...PUBLISHED_JOB, status: "selected", stageEnteredAt: { gte: startOfMonthUTC(now) } },
    }),
  ]);
  return {
    openJobs,
    applicationsLast7,
    applicationsPrevious7,
    applicationsTrend: compareCounts(applicationsLast7, applicationsPrevious7),
    atInterview,
    selectedThisMonth,
  };
}

export type NewToReviewItem = {
  id: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  appliedAt: string;
  knockoutFlagged: boolean;
};

/** Newest applications still in "applied". */
export async function getNewToReview(limit = 6): Promise<{ items: NewToReviewItem[]; total: number }> {
  const where: Prisma.JobApplicationWhereInput = { ...PUBLISHED_JOB, status: "applied" };
  const [rows, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      take: limit,
      select: {
        id: true,
        appliedAt: true,
        knockoutFlagged: true,
        jobId: true,
        job: { select: { title: true } },
        candidate: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.jobApplication.count({ where }),
  ]);
  return {
    total,
    items: rows.map((r) => ({
      id: r.id,
      candidateName: candidateName(r.candidate),
      jobId: r.jobId,
      jobTitle: r.job.title,
      appliedAt: r.appliedAt.toISOString(),
      knockoutFlagged: r.knockoutFlagged,
    })),
  };
}

/** Non-terminal applications in the same stage for 7+ days, oldest first. */
export async function getNeedsAttention(now: number, limit = 8): Promise<{ items: StuckApplication[]; total: number }> {
  const where: Prisma.JobApplicationWhereInput = {
    ...PUBLISHED_JOB,
    status: { in: NON_TERMINAL },
    stageEnteredAt: { lte: new Date(now - STAGE_WARNING_DAYS * 24 * 60 * 60 * 1000) },
  };
  const [rows, total] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { stageEnteredAt: "asc" },
      take: limit,
      select: {
        id: true,
        status: true,
        stageEnteredAt: true,
        jobId: true,
        job: { select: { title: true } },
        candidate: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.jobApplication.count({ where }),
  ]);
  const items = needsAttention(
    rows.map((r) => ({
      id: r.id,
      candidateName: candidateName(r.candidate),
      jobId: r.jobId,
      jobTitle: r.job.title,
      status: r.status,
      stageEnteredAt: r.stageEnteredAt.toISOString(),
    })),
    now,
    limit,
  );
  return { items, total };
}

/** One row per published job: counts per stage, days open and warnings. */
export async function getJobHealth(now: number): Promise<JobHealth[]> {
  const jobs = await prisma.job.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, publishedAt: true, deadline: true },
  });
  if (jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const [byStatus, latest] = await Promise.all([
    prisma.jobApplication.groupBy({ by: ["jobId", "status"], where: { jobId: { in: jobIds } }, _count: { _all: true } }),
    prisma.jobApplication.groupBy({ by: ["jobId"], where: { jobId: { in: jobIds } }, _max: { appliedAt: true } }),
  ]);

  const counts = new Map<string, Partial<Record<ApplicationStatus, number>>>();
  for (const row of byStatus) {
    const entry = counts.get(row.jobId) ?? {};
    entry[row.status] = row._count._all;
    counts.set(row.jobId, entry);
  }
  const lastApplied = new Map(latest.map((row) => [row.jobId, row._max.appliedAt]));

  return jobs.map((job) =>
    jobHealth(
      {
        id: job.id,
        title: job.title,
        publishedAt: job.publishedAt?.toISOString() ?? null,
        deadline: job.deadline ? job.deadline.toISOString().slice(0, 10) : null,
        lastAppliedAt: lastApplied.get(job.id)?.toISOString() ?? null,
        countsByStatus: counts.get(job.id) ?? {},
      },
      now,
    ),
  );
}
