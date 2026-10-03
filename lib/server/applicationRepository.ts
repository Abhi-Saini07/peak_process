import "server-only";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { deleteStoredFile, readStoredFile, saveUploadedFile, type SavedFileMeta } from "@/lib/server/fileStorage";
import { applicationReferenceFromId } from "@/lib/recruitment/reference";
import { isJobOpenForApplications } from "@/lib/server/jobRepository";
import type { CandidateDetailsInput, JobApplicationFormData } from "@/lib/schemas/application.schema";
import { logAdminAction } from "@/lib/server/auditLog";
import type { ApplicationStatus as AppStatus } from "@/lib/recruitment/constants";
import { canTransition, GUARDED_STAGES } from "@/lib/recruitment/stages";
import type { RejectInput } from "@/lib/recruitment/rejection";
import type { NoteInput } from "@/lib/recruitment/notes";
import { parseOfferDetails } from "@/lib/recruitment/offers";
import { EMAIL_TEMPLATE_LABEL, type EmailTemplate } from "@/lib/email/templates/labels";
import {
  computeKnockoutFlag,
  parseStoredKnockoutAnswers,
  snapshotKnockoutAnswers,
  type KnockoutQuestion,
} from "@/lib/recruitment/knockouts";
import type {
  ApplicationDetail,
  ApplicationDocumentMeta,
  ApplicationNoteEntry,
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
    emailLogs: { orderBy: { createdAt: "asc" } },
  },
} satisfies Prisma.JobApplicationDefaultArgs;

const NOTE_WITH_AUTHOR = { include: { author: { select: { fullName: true } } } } satisfies Prisma.ApplicationNoteDefaultArgs;
type NoteWithAuthor = Prisma.ApplicationNoteGetPayload<typeof NOTE_WITH_AUTHOR>;
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
    knockoutFlagged: app.knockoutFlagged,
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

function mapNote(note: NoteWithAuthor): ApplicationNoteEntry {
  return {
    id: note.id,
    body: note.body,
    rating: note.rating,
    authorName: note.author?.fullName ?? null,
    createdAt: toISO(note.createdAt),
  };
}

function offerOf(app: { offerDetails: Prisma.JsonValue; offerSentAt: Date | null }): ApplicationDetail["offer"] {
  const details = parseOfferDetails(app.offerDetails);
  return details && app.offerSentAt ? { details, sentAt: toISO(app.offerSentAt) } : null;
}

function mapDetail(app: ApplicationWithRelations, notes: NoteWithAuthor[]): ApplicationDetail {
  return {
    ...mapSummary(app),
    jobId: app.jobId,
    jobTitle: app.job.title,
    firstName: app.candidate.firstName,
    lastName: app.candidate.lastName,
    location: app.candidate.location,
    education: app.candidate.education,
    linkedinUrl: app.candidate.linkedinUrl,
    portfolioUrl: app.candidate.portfolioUrl,
    coverLetter: app.coverLetter,
    rejectNote: app.rejectNote,
    documents: app.documents.map(mapDocument),
    history: app.statusHistory.map(mapHistory),
    notes: notes.map(mapNote),
    knockoutAnswers: parseStoredKnockoutAnswers(app.knockoutAnswers),
    offer: offerOf(app),
    emails: app.emailLogs.map((e) => ({
      id: e.id,
      label: EMAIL_TEMPLATE_LABEL[e.template as EmailTemplate] ?? e.template,
      recipient: e.recipient,
      status: e.status,
      error: e.error,
      createdAt: toISO(e.createdAt),
    })),
    employeeId: app.employeeId,
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
  const [app, notes] = await Promise.all([
    prisma.jobApplication.findUnique({ where: { id }, ...APPLICATION_WITH_RELATIONS }),
    prisma.applicationNote.findMany({ where: { applicationId: id }, ...NOTE_WITH_AUTHOR, orderBy: { createdAt: "desc" } }),
  ]);
  return app ? mapDetail(app, notes) : null;
}

/** Newest first. Null when the application doesn't exist. */
export async function getApplicationNotes(applicationId: string): Promise<ApplicationNoteEntry[] | null> {
  const exists = await prisma.jobApplication.findUnique({ where: { id: applicationId }, select: { id: true } });
  if (!exists) return null;
  const notes = await prisma.applicationNote.findMany({
    where: { applicationId },
    ...NOTE_WITH_AUTHOR,
    orderBy: { createdAt: "desc" },
  });
  return notes.map(mapNote);
}

export async function addApplicationNote(
  applicationId: string,
  input: NoteInput,
  authorAdminId: string,
): Promise<ApplicationNoteEntry | null> {
  try {
    const note = await prisma.applicationNote.create({
      data: { applicationId, authorAdminId, body: input.body, rating: input.rating },
      ...NOTE_WITH_AUTHOR,
    });
    return mapNote(note);
  } catch (error) {
    // Foreign key: the application was deleted (or never existed).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return null;
    throw error;
  }
}

interface CreateApplicationInput {
  jobId: string;
  data: JobApplicationFormData;
  resumeFile: File;
  otherFile?: File | null;
  /** The job's questions as loaded on the server, and the candidate's answers. */
  knockoutQuestions: KnockoutQuestion[];
  knockoutAnswers: Record<string, boolean>;
  consentVersion: string;
}

const DUPLICATE_APPLICATION = "You've already applied to this position.";

/**
 * Finds-or-creates the candidate by email (so the same person can apply to
 * multiple jobs), re-checks job availability, blocks a second application to
 * the same job, then saves everything. Files go to storage first; the
 * candidate, application, history row and documents are then written in one
 * transaction, and if that fails the uploaded files are deleted again, so a
 * failure never leaves orphaned objects or half an application behind.
 */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<{ applicationId: string; reference: string } | { error: string }> {
  const jobOpen = await isJobOpenForApplications(input.jobId);
  if (!jobOpen) return { error: "This position is no longer accepting applications." };

  const email = input.data.email.trim().toLowerCase();
  // Cheap early check so a repeat applicant doesn't upload files for nothing.
  // The unique index on (job_id, candidate_id) still decides inside the transaction.
  const existing = await prisma.jobApplication.findFirst({
    where: { jobId: input.jobId, candidate: { email } },
    select: { id: true },
  });
  if (existing) return { error: DUPLICATE_APPLICATION };

  const applicationId = randomUUID();
  const uploaded: SavedFileMeta[] = [];
  const documents: { documentType: "resume" | "other"; meta: SavedFileMeta }[] = [];
  try {
    const files = [
      { documentType: "resume" as const, file: input.resumeFile },
      ...(input.otherFile ? [{ documentType: "other" as const, file: input.otherFile }] : []),
    ];
    for (const { documentType, file } of files) {
      const meta = await saveUploadedFile(file, `applications/${applicationId}`);
      uploaded.push(meta);
      documents.push({ documentType, meta });
    }
  } catch (error) {
    await Promise.all(uploaded.map((meta) => deleteStoredFile(meta.storagePath)));
    throw error;
  }

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
  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.upsert({
        where: { email },
        update: candidateFields,
        create: { email, ...candidateFields },
      });
      await tx.jobApplication.create({
        data: {
          id: applicationId,
          jobId: input.jobId,
          candidateId: candidate.id,
          status: "applied",
          stageEnteredAt: now,
          coverLetter: input.data.coverLetter || null,
          // Recomputed here from the stored questions; the client's view is never trusted.
          knockoutAnswers:
            input.knockoutQuestions.length > 0
              ? snapshotKnockoutAnswers(input.knockoutQuestions, input.knockoutAnswers)
              : Prisma.DbNull,
          knockoutFlagged: computeKnockoutFlag(input.knockoutQuestions, input.knockoutAnswers),
          consentedAt: now,
          consentVersion: input.consentVersion,
        },
      });
      await tx.applicationStatusHistory.create({
        data: { applicationId, oldStatus: null, newStatus: "applied", changedByAdminId: null, changedAt: now },
      });
      await tx.applicationDocument.createMany({
        data: documents.map(({ documentType, meta }) => ({ applicationId, documentType, ...meta })),
      });
    });
  } catch (error) {
    await Promise.all(uploaded.map((meta) => deleteStoredFile(meta.storagePath)));
    // Lost a race with a second submission for the same job.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: DUPLICATE_APPLICATION };
    }
    throw error;
  }

  return { applicationId, reference: applicationReferenceFromId(applicationId) };
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
  const guarded = GUARDED_STAGES[newStatus];
  if (guarded) {
    return {
      error: guarded === "offer" ? "Use the offer form to make an offer." : "Use “Mark as hired” to hire someone.",
      code: "illegal_transition",
    };
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

// ---------------------------------------------------------------------------
// HR edits to the candidate's details
// ---------------------------------------------------------------------------

/**
 * Corrects the candidate's contact and profile details. The candidate row is
 * shared by all their applications, so the change shows on each of them.
 * Audited; an email already used by another candidate is refused.
 */
export async function updateCandidateDetails(
  applicationId: string,
  input: CandidateDetailsInput,
  adminId: string,
): Promise<{ ok: true } | { error: string; code: "not_found" | "conflict" }> {
  const app = await prisma.jobApplication.findUnique({ where: { id: applicationId }, select: { candidateId: true } });
  if (!app) return { error: "Application not found", code: "not_found" };
  try {
    await prisma.$transaction(async (tx) => {
      await tx.candidate.update({
        where: { id: app.candidateId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone || null,
          location: input.location || null,
          experienceYears: input.experienceYears ?? null,
          education: input.education || null,
          linkedinUrl: input.linkedinUrl || null,
          portfolioUrl: input.portfolioUrl || null,
        },
      });
      await logAdminAction(
        { actorAdminId: adminId, action: "candidate.update", entity: "candidate", entityId: app.candidateId, meta: { applicationId } },
        tx,
      );
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Another candidate already uses this email.", code: "conflict" };
    }
    throw error;
  }
}
