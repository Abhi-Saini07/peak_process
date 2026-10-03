import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { OfferDetails } from "@/lib/recruitment/offers";
import { logAdminAction } from "@/lib/server/auditLog";
import { createOnboardingInvite } from "@/lib/server/onboardingInvites";
import { seedHrProvidedDocuments } from "@/lib/server/employeeDocuments";

/**
 * Offers and hiring: the two moves that can't be a plain status change.
 * Each is one short transaction that also writes its history row.
 */

export type OfferResult = { ok: true } | { error: string; code: "not_found" | "illegal_transition" | "conflict" };

/** interview → offered, storing the offer. Also allows revising an offer
 *  that is already out (status stays "offered", no new history row). */
export async function makeOffer(applicationId: string, offer: OfferDetails, adminId: string): Promise<OfferResult> {
  const app = await prisma.jobApplication.findUnique({ where: { id: applicationId }, select: { status: true } });
  if (!app) return { error: "Application not found", code: "not_found" };
  if (app.status !== "interview" && app.status !== "offered") {
    return { error: "Offers can only be made after the interview stage.", code: "illegal_transition" };
  }

  const now = new Date();
  const done = await prisma.$transaction(async (tx) => {
    if (app.status === "offered") {
      const updated = await tx.jobApplication.updateMany({
        where: { id: applicationId, status: "offered" },
        data: { offerDetails: offer, offerSentAt: now },
      });
      return updated.count === 1;
    }
    const updated = await tx.jobApplication.updateMany({
      where: { id: applicationId, status: "interview" },
      data: { status: "offered", stageEnteredAt: now, offerDetails: offer, offerSentAt: now },
    });
    if (updated.count !== 1) return false;
    await tx.applicationStatusHistory.create({
      data: { applicationId, oldStatus: "interview", newStatus: "offered", changedByAdminId: adminId, changedAt: now },
    });
    return true;
  });
  return done ? { ok: true } : { error: "This application was just updated by someone else. Refresh and try again.", code: "conflict" };
}

export type HireResult =
  | { ok: true; employeeId: string; alreadyHired: boolean; inviteToken: string | null; inviteExpiresAt: string | null }
  | { error: string; code: "not_found" | "illegal_transition" };

/**
 * offered → selected (hired), in ONE transaction: creates the Employee
 * (prefilled from the candidate), links both records, writes the history
 * row and an onboarding invite, and logs the hire. Idempotent: if this
 * application already has an Employee, that one is returned and nothing is
 * created. Two clicks at once can't both create one: the status update is
 * conditional (status = offered AND employee_id IS NULL), and the unique
 * indexes on both link columns back that up.
 */
export async function hireApplication(applicationId: string, adminId: string): Promise<HireResult> {
  const existing = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { status: true, employeeId: true },
  });
  if (!existing) return { error: "Application not found", code: "not_found" };
  if (existing.employeeId) {
    return { ok: true, employeeId: existing.employeeId, alreadyHired: true, inviteToken: null, inviteExpiresAt: null };
  }
  if (existing.status !== "offered") {
    return { error: "Only someone with an offer can be marked as hired.", code: "illegal_transition" };
  }

  const now = new Date();
  const outcome = await prisma.$transaction(async (tx) => {
    const claimed = await tx.jobApplication.updateMany({
      where: { id: applicationId, status: "offered", employeeId: null },
      data: { status: "selected", stageEnteredAt: now },
    });
    if (claimed.count !== 1) return null;

    const app = await tx.jobApplication.findUniqueOrThrow({
      where: { id: applicationId },
      include: { candidate: true, job: { select: { title: true } } },
    });
    const c = app.candidate;
    const employee = await tx.employee.create({
      data: {
        fullName: `${c.firstName} ${c.lastName}`.trim(),
        status: "in_progress",
        sourceApplicationId: applicationId,
        personalInformation: {
          create: { firstName: c.firstName, lastName: c.lastName, personalEmail: c.email, phone: c.phone },
        },
      },
    });
    await seedHrProvidedDocuments(employee.id, tx);
    await tx.jobApplication.update({ where: { id: applicationId }, data: { employeeId: employee.id } });
    await tx.applicationStatusHistory.create({
      data: { applicationId, oldStatus: "offered", newStatus: "selected", changedByAdminId: adminId, changedAt: now },
    });
    const invite = await createOnboardingInvite(employee.id, adminId, tx, now);
    await logAdminAction(
      {
        actorAdminId: adminId,
        action: "application.hire",
        entity: "job_application",
        entityId: applicationId,
        meta: { employeeId: employee.id, jobTitle: app.job.title },
      },
      tx,
    );
    return { employeeId: employee.id, invite };
  });

  if (!outcome) {
    // Lost a race: someone else hired (or moved) them a moment ago.
    const after = await prisma.jobApplication.findUnique({ where: { id: applicationId }, select: { employeeId: true } });
    if (after?.employeeId) {
      return { ok: true, employeeId: after.employeeId, alreadyHired: true, inviteToken: null, inviteExpiresAt: null };
    }
    return { error: "This application was just updated by someone else. Refresh and try again.", code: "illegal_transition" };
  }
  return {
    ok: true,
    employeeId: outcome.employeeId,
    alreadyHired: false,
    inviteToken: outcome.invite.token,
    inviteExpiresAt: outcome.invite.expiresAt.toISOString(),
  };
}

/** A new onboarding link for an existing Employee (older unused links stop working). */
export async function reissueOnboardingInvite(
  employeeId: string,
  adminId: string,
): Promise<{ token: string; expiresAt: string } | null> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, status: true } });
  if (!employee) return null;
  return prisma.$transaction(async (tx) => {
    const invite = await createOnboardingInvite(employeeId, adminId, tx);
    await logAdminAction(
      { actorAdminId: adminId, action: "employee.onboarding_link", entity: "employee", entityId: employeeId },
      tx,
    );
    return { token: invite.token, expiresAt: invite.expiresAt.toISOString() };
  });
}
