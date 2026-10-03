import "server-only";
import { createHash, randomBytes } from "crypto";
import { Prisma, type InterviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SLOT_RULES, generateSlots, isOfferedSlot, type BusyRange } from "@/lib/recruitment/slots";
import { officeTimeZone, zonedTimeToUtc } from "@/lib/recruitment/timezones";
import { canChangeInterviewStatus, type ManualInterviewInput, type ScheduleInviteInput } from "@/lib/recruitment/interviews";
import { isTerminalStage } from "@/lib/recruitment/stages";

/**
 * Interviews and self-scheduling links. Booking is race-safe in three layers:
 * the slot must be in the list generateSlots() gives right now, the invite is
 * claimed with updateMany(status = pending) → count must be 1 in the same
 * transaction that creates the Interview, and a partial unique index stops an
 * interviewer holding two scheduled interviews at the same time.
 */

const MINUTE = 60_000;

export function hashScheduleToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function slotRules() {
  return { ...DEFAULT_SLOT_RULES, timeZone: officeTimeZone() };
}

/** The interviewer's scheduled interviews that touch [from, to). */
async function busyRanges(interviewerAdminId: string, from: Date, to: Date, db: Prisma.TransactionClient = prisma): Promise<BusyRange[]> {
  const rows = await db.interview.findMany({
    where: {
      interviewerAdminId,
      status: "scheduled",
      scheduledAt: { lt: to, gte: new Date(from.getTime() - 240 * MINUTE) },
    },
    select: { scheduledAt: true, durationMinutes: true },
  });
  return rows.map((r) => ({ start: r.scheduledAt, end: new Date(r.scheduledAt.getTime() + r.durationMinutes * MINUTE) }));
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export type InterviewResult<T = { interviewId: string }> =
  | ({ ok: true } & T)
  | { error: string; code: "not_found" | "invalid" | "conflict" | "gone" };

// ---------------------------------------------------------------------------
// HR: manual scheduling and status changes
// ---------------------------------------------------------------------------

export async function listInterviewers(): Promise<{ id: string; fullName: string; email: string }[]> {
  return prisma.adminUser.findMany({ select: { id: true, fullName: true, email: true }, orderBy: { fullName: "asc" } });
}

export async function createManualInterview(
  applicationId: string,
  input: ManualInterviewInput,
  adminId: string,
  now = new Date(),
): Promise<InterviewResult> {
  const app = await prisma.jobApplication.findUnique({ where: { id: applicationId }, select: { status: true } });
  if (!app) return { error: "Application not found", code: "not_found" };
  if (isTerminalStage(app.status)) return { error: "This application is closed.", code: "invalid" };
  const interviewer = await prisma.adminUser.findUnique({ where: { id: input.interviewerAdminId }, select: { id: true } });
  if (!interviewer) return { error: "Choose an interviewer from the list.", code: "invalid" };

  const start = new Date(input.scheduledAt);
  if (start.getTime() <= now.getTime()) return { error: "Pick a time in the future.", code: "invalid" };
  const end = new Date(start.getTime() + input.durationMinutes * MINUTE);
  const busy = await busyRanges(input.interviewerAdminId, start, end);
  if (busy.some((b) => start < b.end && b.start < end)) {
    return { error: "The interviewer already has an interview at that time.", code: "conflict" };
  }

  try {
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        scheduledAt: start,
        durationMinutes: input.durationMinutes,
        mode: input.mode,
        interviewerAdminId: input.interviewerAdminId,
        meetingUrl: input.meetingUrl || null,
        location: input.location || null,
        notes: input.notes || null,
        createdByAdminId: adminId,
      },
    });
    return { ok: true, interviewId: interview.id };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "The interviewer already has an interview at that time.", code: "conflict" };
    throw error;
  }
}

/** scheduled → completed / cancelled / no_show. Cancelling one booked through a link closes that link too. */
export async function updateInterviewStatus(id: string, to: InterviewStatus): Promise<InterviewResult<{ applicationId: string }>> {
  const interview = await prisma.interview.findUnique({ where: { id }, select: { status: true, applicationId: true } });
  if (!interview) return { error: "Interview not found", code: "not_found" };
  if (!canChangeInterviewStatus(interview.status, to)) return { error: "This interview is already closed.", code: "conflict" };

  const done = await prisma.$transaction(async (tx) => {
    const updated = await tx.interview.updateMany({
      where: { id, status: "scheduled" },
      data: { status: to, cancelledAt: to === "cancelled" ? new Date() : null },
    });
    if (updated.count !== 1) return false;
    if (to === "cancelled") {
      await tx.scheduleInvite.updateMany({ where: { interviewId: id, status: "booked" }, data: { status: "cancelled" } });
    }
    return true;
  });
  return done ? { ok: true, applicationId: interview.applicationId } : { error: "This interview was just updated. Refresh and try again.", code: "conflict" };
}

// ---------------------------------------------------------------------------
// HR: scheduling links
// ---------------------------------------------------------------------------

/** Window from office-calendar dates: start of the first day to the end of the last. */
export function inviteWindow(input: Pick<ScheduleInviteInput, "windowStartDate" | "windowEndDate">, timeZone = officeTimeZone()) {
  const [sy, sm, sd] = input.windowStartDate.split("-").map(Number);
  const [ey, em, ed] = input.windowEndDate.split("-").map(Number);
  const endDay = new Date(Date.UTC(ey, em - 1, ed + 1));
  return {
    windowStart: zonedTimeToUtc(sy, sm, sd, 0, 0, timeZone),
    windowEnd: zonedTimeToUtc(endDay.getUTCFullYear(), endDay.getUTCMonth() + 1, endDay.getUTCDate(), 0, 0, timeZone),
  };
}

export async function createScheduleInvite(
  applicationId: string,
  input: ScheduleInviteInput,
  adminId: string,
  now = new Date(),
): Promise<InterviewResult<{ inviteId: string; token: string }>> {
  const app = await prisma.jobApplication.findUnique({ where: { id: applicationId }, select: { status: true } });
  if (!app) return { error: "Application not found", code: "not_found" };
  if (isTerminalStage(app.status)) return { error: "This application is closed.", code: "invalid" };
  const interviewer = await prisma.adminUser.findUnique({ where: { id: input.interviewerAdminId }, select: { id: true } });
  if (!interviewer) return { error: "Choose an interviewer from the list.", code: "invalid" };

  const { windowStart, windowEnd } = inviteWindow(input);
  const busy = await busyRanges(input.interviewerAdminId, windowStart, windowEnd);
  const slots = generateSlots({ now, windowStart, windowEnd, durationMinutes: input.durationMinutes, busy, rules: slotRules(), limit: 1 });
  if (slots.length === 0) {
    return { error: "There are no open times in those dates (weekdays 9–5, at least 24 hours away).", code: "invalid" };
  }

  const token = randomBytes(32).toString("base64url");
  const invite = await prisma.scheduleInvite.create({
    data: {
      applicationId,
      tokenHash: hashScheduleToken(token),
      interviewerAdminId: input.interviewerAdminId,
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      meetingUrl: input.meetingUrl || null,
      location: input.location || null,
      windowStart,
      windowEnd,
      createdByAdminId: adminId,
    },
  });
  return { ok: true, inviteId: invite.id, token };
}

export async function cancelScheduleInvite(id: string): Promise<InterviewResult<{ applicationId: string }>> {
  const invite = await prisma.scheduleInvite.findUnique({ where: { id }, select: { applicationId: true } });
  if (!invite) return { error: "Scheduling link not found", code: "not_found" };
  const updated = await prisma.scheduleInvite.updateMany({ where: { id, status: "pending" }, data: { status: "cancelled" } });
  if (updated.count !== 1) return { error: "Only links that haven't been booked yet can be cancelled.", code: "conflict" };
  return { ok: true, applicationId: invite.applicationId };
}

// ---------------------------------------------------------------------------
// Candidate: the public /schedule/[token] page
// ---------------------------------------------------------------------------

const INVITE_FOR_PAGE = {
  include: {
    application: { select: { id: true, job: { select: { title: true } }, candidate: { select: { firstName: true, lastName: true } } } },
    interview: true,
  },
} satisfies Prisma.ScheduleInviteDefaultArgs;
type InviteForPage = Prisma.ScheduleInviteGetPayload<typeof INVITE_FOR_PAGE>;

export type ScheduleState =
  | { kind: "invalid" }
  | { kind: "expired" | "cancelled"; jobTitle: string }
  | {
      kind: "pending";
      jobTitle: string;
      firstName: string;
      durationMinutes: number;
      mode: string;
      slots: string[];
      windowStart: string;
      windowEnd: string;
      officeTimeZone: string;
    }
  | {
      kind: "booked";
      jobTitle: string;
      firstName: string;
      durationMinutes: number;
      mode: string;
      scheduledAt: string;
      meetingUrl: string | null;
      location: string | null;
      officeTimeZone: string;
    };

async function findInvite(token: string): Promise<InviteForPage | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  return prisma.scheduleInvite.findUnique({ where: { tokenHash: hashScheduleToken(token) }, ...INVITE_FOR_PAGE });
}

async function slotsFor(invite: { interviewerAdminId: string; windowStart: Date; windowEnd: Date; durationMinutes: number }, now: Date) {
  const busy = await busyRanges(invite.interviewerAdminId, invite.windowStart, invite.windowEnd);
  return generateSlots({
    now,
    windowStart: invite.windowStart,
    windowEnd: invite.windowEnd,
    durationMinutes: invite.durationMinutes,
    busy,
    rules: slotRules(),
  });
}

export async function getScheduleState(token: string, now = new Date()): Promise<ScheduleState> {
  const invite = await findInvite(token);
  if (!invite) return { kind: "invalid" };
  const jobTitle = invite.application.job.title;
  const firstName = invite.application.candidate.firstName;

  if (invite.status === "booked" && invite.interview && invite.interview.status === "scheduled") {
    return {
      kind: "booked",
      jobTitle,
      firstName,
      durationMinutes: invite.interview.durationMinutes,
      mode: invite.interview.mode,
      scheduledAt: invite.interview.scheduledAt.toISOString(),
      meetingUrl: invite.interview.meetingUrl,
      location: invite.interview.location,
      officeTimeZone: officeTimeZone(),
    };
  }
  if (invite.status === "cancelled" || invite.status === "booked") return { kind: "cancelled", jobTitle };
  if (invite.status === "expired" || invite.windowEnd <= now) {
    if (invite.status === "pending") await prisma.scheduleInvite.updateMany({ where: { id: invite.id, status: "pending" }, data: { status: "expired" } });
    return { kind: "expired", jobTitle };
  }

  const slots = await slotsFor(invite, now);
  return {
    kind: "pending",
    jobTitle,
    firstName,
    durationMinutes: invite.durationMinutes,
    mode: invite.mode,
    slots: slots.map((s) => s.toISOString()),
    windowStart: invite.windowStart.toISOString(),
    windowEnd: invite.windowEnd.toISOString(),
    officeTimeZone: officeTimeZone(),
  };
}

/**
 * Books `slotISO` for the link. Rejects anything not in the slot list computed
 * right now; claims the invite (pending → booked, count must be 1) and creates
 * the Interview in one transaction; the partial unique index catches a slot
 * taken by another booking in the same instant.
 */
export async function bookSlot(
  token: string,
  slotISO: string,
  now = new Date(),
): Promise<InterviewResult<{ interviewId: string; rescheduled: boolean }>> {
  const invite = await findInvite(token);
  if (!invite) return { error: "This scheduling link isn't valid.", code: "not_found" };
  if (invite.status !== "pending" || invite.windowEnd <= now) {
    return { error: "This link can't be used to book any more.", code: "gone" };
  }
  const slot = new Date(slotISO);
  if (Number.isNaN(slot.getTime())) return { error: "Pick one of the times shown.", code: "invalid" };
  const slots = await slotsFor(invite, now);
  if (!isOfferedSlot(slot, slots)) {
    return { error: "That time isn't available any more. Please pick another.", code: "conflict" };
  }
  const rescheduled = (await prisma.interview.count({ where: { scheduleInviteId: invite.id } })) > 0;

  try {
    const interviewId = await prisma.$transaction(async (tx) => {
      const claimed = await tx.scheduleInvite.updateMany({ where: { id: invite.id, status: "pending" }, data: { status: "booked" } });
      if (claimed.count !== 1) return null;
      const interview = await tx.interview.create({
        data: {
          applicationId: invite.applicationId,
          scheduledAt: slot,
          durationMinutes: invite.durationMinutes,
          mode: invite.mode,
          interviewerAdminId: invite.interviewerAdminId,
          meetingUrl: invite.meetingUrl,
          location: invite.location,
          createdByAdminId: invite.createdByAdminId,
          scheduleInviteId: invite.id,
        },
      });
      await tx.scheduleInvite.update({ where: { id: invite.id }, data: { interviewId: interview.id } });
      return interview.id;
    });
    if (!interviewId) return { error: "This link was just used to book a time.", code: "gone" };
    return { ok: true, interviewId, rescheduled };
  } catch (error) {
    if (isUniqueViolation(error)) return { error: "Someone just took that time. Please pick another.", code: "conflict" };
    throw error;
  }
}

/** Candidate cancels: the interview is cancelled (kept) and the link closes. */
export async function cancelByCandidate(token: string): Promise<InterviewResult<{ interviewId: string }>> {
  const invite = await findInvite(token);
  if (!invite || !invite.interviewId) return { error: "There's no booked interview on this link.", code: "not_found" };
  const interviewId = invite.interviewId;
  const done = await prisma.$transaction(async (tx) => {
    const updated = await tx.interview.updateMany({ where: { id: interviewId, status: "scheduled" }, data: { status: "cancelled", cancelledAt: new Date() } });
    if (updated.count !== 1) return false;
    await tx.scheduleInvite.update({ where: { id: invite.id }, data: { status: "cancelled" } });
    return true;
  });
  return done ? { ok: true, interviewId } : { error: "This interview is no longer scheduled.", code: "gone" };
}

/** Candidate reschedules: the current interview is cancelled (kept as history) and the link opens again. */
export async function rescheduleByCandidate(token: string, now = new Date()): Promise<InterviewResult<{ interviewId: string }>> {
  const invite = await findInvite(token);
  if (!invite || !invite.interviewId) return { error: "There's no booked interview on this link.", code: "not_found" };
  if (invite.windowEnd <= now) return { error: "The window for this link has passed. Please contact us.", code: "gone" };
  const interviewId = invite.interviewId;
  const done = await prisma.$transaction(async (tx) => {
    const updated = await tx.interview.updateMany({ where: { id: interviewId, status: "scheduled" }, data: { status: "cancelled", cancelledAt: new Date() } });
    if (updated.count !== 1) return false;
    const reopened = await tx.scheduleInvite.updateMany({ where: { id: invite.id, status: "booked" }, data: { status: "pending", interviewId: null } });
    return reopened.count === 1;
  });
  return done ? { ok: true, interviewId } : { error: "This interview is no longer scheduled.", code: "gone" };
}

/** The booked interview behind a link, for the .ics download. */
export async function getBookedInterviewForToken(token: string) {
  const invite = await findInvite(token);
  if (!invite?.interview || invite.status !== "booked" || invite.interview.status !== "scheduled") return null;
  return { interview: invite.interview, jobTitle: invite.application.job.title };
}

// ---------------------------------------------------------------------------
// Reads for the admin pages
// ---------------------------------------------------------------------------

export type InterviewRow = {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  mode: string;
  status: InterviewStatus;
  interviewerName: string;
  meetingUrl: string | null;
  location: string | null;
  notes: string | null;
  viaLink: boolean;
};

export type ScheduleInviteRow = {
  id: string;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
  durationMinutes: number;
  mode: string;
  windowStart: string;
  windowEnd: string;
  status: string;
  createdAt: string;
};

const INTERVIEW_ROW = {
  include: {
    interviewer: { select: { fullName: true } },
    application: { select: { job: { select: { title: true } }, candidate: { select: { firstName: true, lastName: true } } } },
  },
} satisfies Prisma.InterviewDefaultArgs;

function toInterviewRow(i: Prisma.InterviewGetPayload<typeof INTERVIEW_ROW>): InterviewRow {
  return {
    id: i.id,
    applicationId: i.applicationId,
    candidateName: `${i.application.candidate.firstName} ${i.application.candidate.lastName}`.trim(),
    jobTitle: i.application.job.title,
    scheduledAt: i.scheduledAt.toISOString(),
    durationMinutes: i.durationMinutes,
    mode: i.mode,
    status: i.status,
    interviewerName: i.interviewer.fullName,
    meetingUrl: i.meetingUrl,
    location: i.location,
    notes: i.notes,
    viaLink: Boolean(i.scheduleInviteId),
  };
}

const INVITE_ROW = {
  include: {
    interviewer: { select: { fullName: true } },
    application: { select: { job: { select: { title: true } }, candidate: { select: { firstName: true, lastName: true } } } },
  },
} satisfies Prisma.ScheduleInviteDefaultArgs;

function toInviteRow(i: Prisma.ScheduleInviteGetPayload<typeof INVITE_ROW>): ScheduleInviteRow {
  return {
    id: i.id,
    applicationId: i.applicationId,
    candidateName: `${i.application.candidate.firstName} ${i.application.candidate.lastName}`.trim(),
    jobTitle: i.application.job.title,
    interviewerName: i.interviewer.fullName,
    durationMinutes: i.durationMinutes,
    mode: i.mode,
    windowStart: i.windowStart.toISOString(),
    windowEnd: i.windowEnd.toISOString(),
    status: i.status,
    createdAt: i.createdAt.toISOString(),
  };
}

export async function getApplicationInterviews(applicationId: string): Promise<{ interviews: InterviewRow[]; invites: ScheduleInviteRow[] }> {
  const [interviews, invites] = await Promise.all([
    prisma.interview.findMany({ where: { applicationId }, ...INTERVIEW_ROW, orderBy: { scheduledAt: "desc" } }),
    prisma.scheduleInvite.findMany({ where: { applicationId, status: "pending" }, ...INVITE_ROW, orderBy: { createdAt: "desc" } }),
  ]);
  return { interviews: interviews.map(toInterviewRow), invites: invites.map(toInviteRow) };
}

export async function getUpcomingInterviews(now = new Date(), where: Prisma.InterviewWhereInput = {}): Promise<InterviewRow[]> {
  const rows = await prisma.interview.findMany({
    where: { ...where, status: "scheduled", scheduledAt: { gte: new Date(now.getTime() - 60 * MINUTE) } },
    ...INTERVIEW_ROW,
    orderBy: { scheduledAt: "asc" },
    take: 200,
  });
  return rows.map(toInterviewRow);
}

export async function getPendingScheduleInvites(now = new Date(), where: Prisma.ScheduleInviteWhereInput = {}): Promise<ScheduleInviteRow[]> {
  const rows = await prisma.scheduleInvite.findMany({
    where: { ...where, status: "pending", windowEnd: { gt: now } },
    ...INVITE_ROW,
    orderBy: { windowEnd: "asc" },
    take: 200,
  });
  return rows.map(toInviteRow);
}
