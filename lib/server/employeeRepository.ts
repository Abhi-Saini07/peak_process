import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { decryptField } from "@/lib/security/encryption";
import { computeCompletionPercent, computeStepStatuses } from "@/lib/onboarding/completion";
import { STEP_META as stepRegistry } from "@/lib/onboarding/steps.meta";
import { EMPLOYEE_WITH_RELATIONS, mapSnapshot } from "@/lib/server/onboardingRepository";
import { logAdminAction } from "@/lib/server/auditLog";
import { maskGovernmentId } from "@/lib/onboarding/masking";
import type { EmployeeDetail, EmployeeSummary, GovernmentIds } from "@/types/employees";

const WITH_SOURCE = {
  include: {
    ...EMPLOYEE_WITH_RELATIONS.include,
    sourceApplication: { select: { id: true, job: { select: { id: true, title: true } } } },
  },
} satisfies Prisma.EmployeeDefaultArgs;
type EmployeeWithSource = Prisma.EmployeeGetPayload<typeof WITH_SOURCE>;

/**
 * Who shows up in the admin Employees list: anyone hired through the
 * pipeline, plus onboarding sessions that have at least a name or were
 * submitted. Anonymous sessions with no data (every browser that opened the
 * onboarding app gets one) are left out.
 */
const REAL_EMPLOYEE: Prisma.EmployeeWhereInput = {
  OR: [
    { sourceApplicationId: { not: null } },
    { fullName: { not: null } },
    { status: "submitted" },
    { personalInformation: { firstName: { not: null } } },
  ],
};

function displayName(e: EmployeeWithSource): string {
  const pi = e.personalInformation;
  return e.fullName?.trim() || [pi?.firstName, pi?.lastName].filter(Boolean).join(" ") || "Unnamed";
}

function toSummary(e: EmployeeWithSource): EmployeeSummary {
  const snapshot = mapSnapshot(e);
  return {
    id: e.id,
    name: displayName(e),
    email: e.personalInformation?.personalEmail ?? null,
    status: e.status,
    completionPercent: computeCompletionPercent(snapshot),
    submissionReference: e.submissionReference,
    submittedAt: e.submittedAt?.toISOString() ?? null,
    hiredFor: e.sourceApplication ? { applicationId: e.sourceApplication.id, jobTitle: e.sourceApplication.job.title } : null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function listEmployees(): Promise<EmployeeSummary[]> {
  const rows = await prisma.employee.findMany({ where: REAL_EMPLOYEE, ...WITH_SOURCE, orderBy: { updatedAt: "desc" }, take: 500 });
  return rows.map(toSummary);
}

/** Everything the read-only detail page shows. Government IDs come back
 *  masked; the full numbers need revealGovernmentIds (audited). */
export async function getEmployeeDetail(id: string): Promise<EmployeeDetail | null> {
  const e = await prisma.employee.findUnique({ where: { id }, ...WITH_SOURCE });
  if (!e) return null;
  const snapshot = mapSnapshot(e);
  const statuses = computeStepStatuses(snapshot);
  const ids = snapshot.personalInfo.governmentIds;
  const latestInvite = await prisma.onboardingInvite.findFirst({
    where: { employeeId: id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, expiresAt: true, usedAt: true },
  });
  return {
    ...toSummary(e),
    steps: stepRegistry.map((s) => ({ id: s.id, label: s.label, status: statuses[s.id] })),
    personalInfo: {
      ...snapshot.personalInfo,
      governmentIds: undefined,
    },
    maskedIds: {
      aadhaar: maskGovernmentId(ids?.aadhaar),
      pan: maskGovernmentId(ids?.pan),
      uan: maskGovernmentId(ids?.uan),
    },
    references: snapshot.references,
    emergencyContact: snapshot.emergencyContact,
    healthInsurance: snapshot.healthInsurance,
    documents: Object.values(snapshot.documents),
    latestInvite: latestInvite
      ? {
          createdAt: latestInvite.createdAt.toISOString(),
          expiresAt: latestInvite.expiresAt.toISOString(),
          usedAt: latestInvite.usedAt?.toISOString() ?? null,
        }
      : null,
  };
}

/** Decrypts the employee's government IDs and records who looked, in the
 *  same transaction, so a reveal can never happen without its audit row. */
export async function revealGovernmentIds(employeeId: string, adminId: string): Promise<GovernmentIds | null> {
  return prisma.$transaction(async (tx) => {
    const pi = await tx.personalInformation.findUnique({
      where: { employeeId },
      select: { aadhaarNumberEnc: true, panNumberEnc: true, uanNumberEnc: true },
    });
    const exists = pi ?? (await tx.employee.findUnique({ where: { id: employeeId }, select: { id: true } }));
    if (!exists) return null;
    const ids: GovernmentIds = {
      aadhaar: decryptField(pi?.aadhaarNumberEnc) ?? null,
      pan: decryptField(pi?.panNumberEnc) ?? null,
      uan: decryptField(pi?.uanNumberEnc) ?? null,
    };
    await logAdminAction(
      {
        actorAdminId: adminId,
        action: "employee.reveal_ids",
        entity: "employee",
        entityId: employeeId,
        meta: { fields: Object.entries(ids).filter(([, v]) => v).map(([k]) => k) },
      },
      tx,
    );
    return ids;
  });
}
