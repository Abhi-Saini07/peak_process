import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { saveUploadedFile, readStoredFile } from "@/lib/server/fileStorage";
import { applicationReferenceFromId } from "@/lib/recruitment/reference";
import { isJobOpenForApplications } from "@/lib/server/jobRepository";
import type { JobApplicationFormData } from "@/lib/schemas/application.schema";
import type { ApplicationStatus as AppStatus } from "@/lib/recruitment/constants";
import { canTransition } from "@/lib/recruitment/stages";
import type { RejectInput } from "@/lib/recruitment/rejection";
import type {
  ApplicationDetail,
  ApplicationDocumentMeta,
  ApplicationStatusHistoryEntry,
  ApplicationSummary,
} from "@/types/recruitment";

function toISO(date: Date): string {
  return date.toISOString();
}

function candidateName(c: { firstName: string; lastName: string }): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

const APPLICATION_WITH_RELATIONS = {
  include: {
    candidate: true,
    job: { select: { title: true } },
    documents: true,
    statusHistory: { include: { changedByAdmin: true }, orderBy: { changedAt: "asc" } },
  },
} satisfies Prisma.JobApplicationDefaultArgs;
type ApplicationWithRelations = Prisma.JobApplicationGetPayload<typeof APPLICATION_WITH_RELATIONS>;

function mapSummary(app: ApplicationWithRelations): ApplicationSummary {
  return {
    id: app.id,
    reference: applicationReferenceFromId(app.id),
    candidateId: app.candidateId,
    candidateName: candidateName(app.candidate),
    email: app.candidate.email,
    phone: app.candidate.phone,
    experienceYears: app.candidate.experienceYears,
    status: app.status,
    appliedAt: toISO(app.appliedAt),
    stageEnteredAt: toISO(app.stageEnteredAt),
    rejectReason: app.rejectReason,
  };
}

function mapDocument(doc: ApplicationWithRelations["documents"][number]): ApplicationDocumentMeta {
  return {
    id: doc.id,
    documentType: doc.documentType,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    uploadedAt: toISO(doc.uploadedAt),
  };
}

function mapHistory(entry: ApplicationWithRelations["statusHistory"][number]): ApplicationStatusHistoryEntry {
  return {
    id: entry.id,
    oldStatus: entry.oldStatus,
    newStatus: entry.newStatus,
    changedByName: entry.changedByAdmin?.fullName ?? null,
    changedAt: toISO(entry.changedAt),
    rejectReason: entry.rejectReason,
    rejectNote: entry.rejectNote,
  };
}

function mapDetail(app: ApplicationWithRelations): ApplicationDetail {
  return {
    ...mapSummary(app),
    jobId: app.jobId,
    jobTitle: app.job.title,
    location: app.candidate.location,
    education: app.candidate.education,
    linkedinUrl: app.candidate.linkedinUrl,
    portfolioUrl: app.candidate.portfolioUrl,
    coverLetter: app.coverLetter,
    rejectNote: app.rejectNote,
    documents: app.documents.map(mapDocument),
    history: app.statusHistory.map(mapHistory),
  };
}

export async function getApplicationsForJob(jobId: string): Promise<ApplicationSummary[]> {
  const apps = await prisma.jobApplication.findMany({
    where: { jobId },
    ...APPLICATION_WITH_RELATIONS,
    orderBy: { appliedAt: "desc" },
  });
  return apps.map(mapSummary);
}

export async function getApplicationById(id: string): Promise<ApplicationDetail | null> {
  const app = await prisma.jobApplication.findUnique({ where: { id }, ...APPLICATION_WITH_RELATIONS });
  return app ? mapDetail(app) : null;
}

interface CreateApplicationInput {
  jobId: string;
  data: JobApplicationFormData;
  resumeFile: File;
  otherFile?: File | null;
}

/** Finds-or-creates the candidate by email (so the same person can apply to
 *  multiple jobs), re-checks job availability server-side, blocks a second
 *  application to the same job, then creates the application + initial
 *  status-history row + saves the resume (and optional other file). */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<{ applicationId: string; reference: string } | { error: string }> {
  const jobOpen = await isJobOpenForApplications(input.jobId);
  if (!jobOpen) return { error: "This position is no longer accepting applications." };

  const email = input.data.email.trim().toLowerCase();
  const candidateFields = {
    firstName: input.data.firstName,
    lastName: input.data.lastName,
    phone: input.data.phone,
    location: input.data.location,
    experienceYears: input.data.experienceYears,
    education: input.data.education,
    linkedinUrl: input.data.linkedinUrl || null,
    portfolioUrl: input.data.portfolioUrl || null,
  };

  const candidate = await prisma.candidate.upsert({
    where: { email },
    update: candidateFields,
    create: { email, ...candidateFields },
  });

  const alreadyApplied = await prisma.jobApplication.findUnique({
    where: { jobId_candidateId: { jobId: input.jobId, candidateId: candidate.id } },
  });
  if (alreadyApplied) return { error: "You've already applied to this position." };

  const application = await prisma.jobApplication.create({
    data: {
      jobId: input.jobId,
      candidateId: candidate.id,
      status: "applied",
      stageEnteredAt: new Date(),
      coverLetter: input.data.coverLetter || null,
    },
  });

  await prisma.applicationStatusHistory.create({
    data: { applicationId: application.id, oldStatus: null, newStatus: "applied", changedByAdminId: null },
  });

  const resumeMeta = await saveUploadedFile(input.resumeFile, `applications/${application.id}`);
  await prisma.applicationDocument.create({
    data: { applicationId: application.id, documentType: "resume", ...resumeMeta },
  });

  if (input.otherFile) {
    const otherMeta = await saveUploadedFile(input.otherFile, `applications/${application.id}`);
    await prisma.applicationDocument.create({
      data: { applicationId: application.id, documentType: "other", ...otherMeta },
    });
  }

  return { applicationId: application.id, reference: applicationReferenceFromId(application.id) };
}

export type StatusChangeResult =
  | { ok: true }
  | { error: string; code: "not_found" | "illegal_transition" | "conflict" };

/**
 * Moves an application to `newStatus` if STAGE_TRANSITIONS allows it. The
 * status, stageEnteredAt, the reject reason (on rejection) and the history
 * row are written in one short transaction; the update is conditional on the
 * status not having changed since it was read, so two HR people moving the
 * same card can't both win.
 */
export async function updateApplicationStatus(
  id: string,
  newStatus: AppStatus,
  adminId: string,
  reject: RejectInput | null = null,
): Promise<StatusChangeResult> {
  const app = await prisma.jobApplication.findUnique({ where: { id }, select: { status: true } });
  if (!app) return { error: "Application not found", code: "not_found" };
  if (!canTransition(app.status, newStatus)) {
    return { error: `Can't move an application from ${app.status} to ${newStatus}.`, code: "illegal_transition" };
  }

  const now = new Date();
  const rejectReason = newStatus === "rejected" ? (reject?.reason ?? null) : null;
  const rejectNote = newStatus === "rejected" ? (reject?.note ?? null) : null;

  const moved = await prisma.$transaction(async (tx) => {
    const updated = await tx.jobApplication.updateMany({
      where: { id, status: app.status },
      data: { status: newStatus, stageEnteredAt: now, rejectReason, rejectNote },
    });
    if (updated.count === 0) return false;
    await tx.applicationStatusHistory.create({
      data: {
        applicationId: id,
        oldStatus: app.status,
        newStatus,
        changedByAdminId: adminId,
        changedAt: now,
        rejectReason,
        rejectNote,
      },
    });
    return true;
  });

  if (!moved) return { error: "This application was just updated by someone else. Refresh and try again.", code: "conflict" };
  return { ok: true };
}

/** Validates docId actually belongs to applicationId before returning a path — never trust the id alone. */
export async function getApplicationDocumentForDownload(
  applicationId: string,
  docId: string,
): Promise<{ storagePath: string; fileName: string; mimeType: string } | null> {
  const doc = await prisma.applicationDocument.findFirst({ where: { id: docId, applicationId } });
  return doc ? { storagePath: doc.storagePath, fileName: doc.fileName, mimeType: doc.mimeType } : null;
}

export { readStoredFile };
