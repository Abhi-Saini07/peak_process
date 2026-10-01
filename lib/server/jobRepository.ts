import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { JobFormData } from "@/lib/schemas/job.schema";
import type { JobStatus } from "@/lib/recruitment/constants";
import type { JobDetail, JobSummary, PublicJobDetail, PublicJobSummary } from "@/types/recruitment";

const JOB_WITH_COUNT = {
  include: { _count: { select: { applications: true } } },
} satisfies Prisma.JobDefaultArgs;
type JobWithCount = Prisma.JobGetPayload<typeof JOB_WITH_COUNT>;

function toISODateOnly(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function toISO(date: Date): string {
  return date.toISOString();
}

function toISOOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function toStringArray(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function excerpt(text: string | null, maxLen = 180): string | null {
  if (!text) return null;
  const firstLine = text.split("\n").find((l) => l.trim().length > 0) ?? text;
  return firstLine.length > maxLen ? `${firstLine.slice(0, maxLen).trimEnd()}…` : firstLine;
}

function mapSummary(job: JobWithCount): JobSummary {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceMinYears: job.experienceMinYears,
    experienceMaxYears: job.experienceMaxYears,
    status: job.status,
    deadline: toISODateOnly(job.deadline),
    createdAt: toISO(job.createdAt),
    applicationCount: job._count.applications,
  };
}

function mapDetail(job: JobWithCount): JobDetail {
  return {
    ...mapSummary(job),
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPublic: job.salaryPublic,
    overview: job.overview,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    requiredSkills: toStringArray(job.requiredSkills),
    preferredSkills: toStringArray(job.preferredSkills),
    education: job.education,
    benefits: job.benefits,
    publishedAt: toISOOrNull(job.publishedAt),
    closedAt: toISOOrNull(job.closedAt),
    updatedAt: toISO(job.updatedAt),
  };
}

function mapPublicSummary(job: JobWithCount): PublicJobSummary {
  return {
    id: job.id,
    title: job.title,
    department: job.department,
    location: job.location,
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceMinYears: job.experienceMinYears,
    experienceMaxYears: job.experienceMaxYears,
    overviewExcerpt: excerpt(job.overview),
  };
}

function mapPublicDetail(job: JobWithCount): PublicJobDetail {
  return {
    ...mapPublicSummary(job),
    salaryMin: job.salaryPublic ? job.salaryMin : null,
    salaryMax: job.salaryPublic ? job.salaryMax : null,
    overview: job.overview,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    requiredSkills: toStringArray(job.requiredSkills),
    preferredSkills: toStringArray(job.preferredSkills),
    education: job.education,
    benefits: job.benefits,
  };
}

/** status = published AND (no deadline OR deadline hasn't passed) — enforced here, not just in the UI. */
function availabilityWhere(): Prisma.JobWhereInput {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return { status: "published", OR: [{ deadline: null }, { deadline: { gte: today } }] };
}

// ---- Admin ----

export async function getAdminJobs(): Promise<JobSummary[]> {
  const jobs = await prisma.job.findMany({ ...JOB_WITH_COUNT, orderBy: { createdAt: "desc" } });
  return jobs.map(mapSummary);
}

export async function getAdminJobById(id: string): Promise<JobDetail | null> {
  const job = await prisma.job.findUnique({ where: { id }, ...JOB_WITH_COUNT });
  return job ? mapDetail(job) : null;
}

export async function createJob(data: JobFormData, createdByAdminId: string): Promise<{ id: string }> {
  const job = await prisma.job.create({
    data: {
      title: data.title,
      department: data.department || null,
      location: data.location || null,
      employmentType: data.employmentType,
      workMode: data.workMode,
      experienceMinYears: data.experienceMinYears ?? null,
      experienceMaxYears: data.experienceMaxYears ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      salaryPublic: data.salaryPublic,
      overview: data.overview || null,
      responsibilities: data.responsibilities || null,
      requirements: data.requirements || null,
      requiredSkills: data.requiredSkills,
      preferredSkills: data.preferredSkills,
      education: data.education || null,
      benefits: data.benefits || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      status: data.status,
      createdBy: createdByAdminId,
      publishedAt: data.status === "published" ? new Date() : null,
    },
  });
  return { id: job.id };
}

function transitionTimestamps(
  existing: { status: JobStatus; publishedAt: Date | null; closedAt: Date | null },
  newStatus: JobStatus,
): { publishedAt: Date | null; closedAt: Date | null } {
  if (existing.status === newStatus) return { publishedAt: existing.publishedAt, closedAt: existing.closedAt };

  if (newStatus === "published") return { publishedAt: existing.publishedAt ?? new Date(), closedAt: null };
  if (newStatus === "closed") return { publishedAt: existing.publishedAt, closedAt: new Date() };
  return { publishedAt: null, closedAt: null }; // back to draft — withdraw entirely
}

/** Edits fields and applies status-transition side effects (publishedAt/closedAt) server-side —
 *  never trusts client-supplied timestamps for these. */
export async function updateJob(id: string, data: JobFormData): Promise<void> {
  const existing = await prisma.job.findUnique({ where: { id }, select: { status: true, publishedAt: true, closedAt: true } });
  if (!existing) throw new Error("Job not found");

  const { publishedAt, closedAt } = transitionTimestamps(existing, data.status);

  await prisma.job.update({
    where: { id },
    data: {
      title: data.title,
      department: data.department || null,
      location: data.location || null,
      employmentType: data.employmentType,
      workMode: data.workMode,
      experienceMinYears: data.experienceMinYears ?? null,
      experienceMaxYears: data.experienceMaxYears ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      salaryPublic: data.salaryPublic,
      overview: data.overview || null,
      responsibilities: data.responsibilities || null,
      requirements: data.requirements || null,
      requiredSkills: data.requiredSkills,
      preferredSkills: data.preferredSkills,
      education: data.education || null,
      benefits: data.benefits || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      status: data.status,
      publishedAt,
      closedAt,
    },
  });
}

/** Status-only transition (Publish/Unpublish/Close quick actions) — deliberately
 *  separate from updateJob so a one-click status change can never overwrite
 *  the job's description/skills/etc. with blanks. */
export async function updateJobStatus(id: string, status: JobStatus): Promise<{ error: string } | { ok: true }> {
  const existing = await prisma.job.findUnique({ where: { id }, select: { status: true, publishedAt: true, closedAt: true } });
  if (!existing) return { error: "Job not found" };

  const { publishedAt, closedAt } = transitionTimestamps(existing, status);
  await prisma.job.update({ where: { id }, data: { status, publishedAt, closedAt } });
  return { ok: true };
}

/** Draft jobs with zero applications only — published/closed jobs are retained for history. */
export async function archiveJob(id: string): Promise<{ error: string } | { ok: true }> {
  const job = await prisma.job.findUnique({ where: { id }, include: { _count: { select: { applications: true } } } });
  if (!job) return { error: "Job not found" };
  if (job.status !== "draft") return { error: "Only draft jobs can be deleted — close a published job instead." };
  if (job._count.applications > 0) return { error: "This job already has applications and can't be deleted." };

  await prisma.job.delete({ where: { id } });
  return { ok: true };
}

// ---- Public ----

export async function getPublicJobs(): Promise<PublicJobSummary[]> {
  const jobs = await prisma.job.findMany({ ...JOB_WITH_COUNT, where: availabilityWhere(), orderBy: { publishedAt: "desc" } });
  return jobs.map(mapPublicSummary);
}

export async function getPublicJobById(id: string): Promise<PublicJobDetail | null> {
  const job = await prisma.job.findFirst({ where: { id, ...availabilityWhere() }, ...JOB_WITH_COUNT });
  return job ? mapPublicDetail(job) : null;
}

/** Server-side re-check used by the apply API route — never trusts that the Apply button was merely shown. */
export async function isJobOpenForApplications(id: string): Promise<boolean> {
  const job = await prisma.job.findFirst({ where: { id, ...availabilityWhere() }, select: { id: true } });
  return Boolean(job);
}

export async function getJobTitle(id: string): Promise<string | null> {
  const job = await prisma.job.findUnique({ where: { id }, select: { title: true } });
  return job?.title ?? null;
}
