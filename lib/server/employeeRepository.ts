import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { decryptField, encryptField } from "@/lib/security/encryption";
import { computeCompletionPercent, computeStepStatuses } from "@/lib/onboarding/completion";
import { STEP_META as stepRegistry } from "@/lib/onboarding/steps.meta";
import {
  EMPLOYEE_WITH_RELATIONS,
  genderToDb,
  mapSnapshot,
  saveEmergencyContact,
  saveHealthInsurance,
  saveReferences,
} from "@/lib/server/onboardingRepository";
import { parseDateOnly } from "@/lib/server/dateOnly";
import {
  EMPLOYEE_EDIT_SCHEMAS,
  type EmployeeEditSection,
  type GovernmentIdsEditInput,
  type PersonalEditInput,
} from "@/lib/onboarding/employeeEdit";
import { logAdminAction } from "@/lib/server/auditLog";
import { maskGovernmentId } from "@/lib/onboarding/masking";
import type { EmployeeDetail, EmployeeSummary, GovernmentIds, PeopleGroup } from "@/types/employees";

const WITH_SOURCE = {
  include: {
    ...EMPLOYEE_WITH_RELATIONS.include,
    sourceApplication: { select: { id: true, job: { select: { id: true, title: true } } } },
    onboardingInvites: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, expiresAt: true, usedAt: true } },
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

function linkState(e: EmployeeWithSource, now: Date): EmployeeSummary["link"] {
  const invite = e.onboardingInvites[0];
  if (!invite) return { state: "none", at: null };
  if (invite.usedAt) return { state: "opened", at: invite.usedAt.toISOString() };
  if (invite.expiresAt <= now) return { state: "expired", at: invite.expiresAt.toISOString() };
  return { state: "sent", at: invite.createdAt.toISOString() };
}

function toSummary(e: EmployeeWithSource, now = new Date()): EmployeeSummary {
  const snapshot = mapSnapshot(e);
  const statuses = computeStepStatuses(snapshot);
  const next = stepRegistry.find((step) => statuses[step.id] !== "completed");
  return {
    id: e.id,
    name: displayName(e),
    email: e.personalInformation?.personalEmail ?? null,
    status: e.status,
    completionPercent: computeCompletionPercent(snapshot),
    submissionReference: e.submissionReference,
    submittedAt: e.submittedAt?.toISOString() ?? null,
    hiredFor: e.sourceApplication ? { applicationId: e.sourceApplication.id, jobTitle: e.sourceApplication.job.title } : null,
    nextStep: e.status === "submitted" ? null : (next?.label ?? null),
    link: linkState(e, now),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

const GROUP_STATUS = { onboarding: "in_progress", employees: "submitted" } as const;

/**
 * One of the two People lists. "onboarding": new hires who haven't submitted
 * yet, most recently active first. "employees": people who finished
 * onboarding, most recently submitted first.
 */
export async function listPeople(group: PeopleGroup): Promise<EmployeeSummary[]> {
  const rows = await prisma.employee.findMany({
    where: { AND: [REAL_EMPLOYEE, { status: GROUP_STATUS[group] }] },
    ...WITH_SOURCE,
    orderBy: group === "employees" ? [{ submittedAt: "desc" }, { updatedAt: "desc" }] : { updatedAt: "desc" },
    take: 500,
  });
  const now = new Date();
  return rows.map((row) => toSummary(row, now));
}

/** How many people are in each list (for the tabs). */
export async function countPeople(): Promise<Record<PeopleGroup, number>> {
  const [onboarding, employees] = await Promise.all([
    prisma.employee.count({ where: { AND: [REAL_EMPLOYEE, { status: "in_progress" }] } }),
    prisma.employee.count({ where: { AND: [REAL_EMPLOYEE, { status: "submitted" }] } }),
  ]);
  return { onboarding, employees };
}

/** Which list a person belongs to (null if there's no such record). */
export async function peopleGroupOf(id: string): Promise<PeopleGroup | null> {
  const e = await prisma.employee.findUnique({ where: { id }, select: { status: true } });
  if (!e) return null;
  return e.status === "submitted" ? "employees" : "onboarding";
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

// ---------------------------------------------------------------------------
// HR edits
// ---------------------------------------------------------------------------

export type EmployeeEditResult = { ok: true } | { error: string; code: "not_found" | "invalid" };

/**
 * Saves one section of a person's record, validated with the same rules as
 * the edit form, together with an audit row naming the section (never the
 * values) in one short transaction.
 */
export async function updateEmployeeSection(
  employeeId: string,
  section: EmployeeEditSection,
  raw: unknown,
  adminId: string,
): Promise<EmployeeEditResult> {
  const parsed = EMPLOYEE_EDIT_SCHEMAS[section].safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details.", code: "invalid" };
  const data = parsed.data;

  return prisma.$transaction(async (tx) => {
    const exists = await tx.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
    if (!exists) return { error: "Employee not found", code: "not_found" } as const;

    let changedFields: string[] = [];
    if (section === "personal") {
      const d = data as PersonalEditInput;
      const values = {
        firstName: d.basicInfo.firstName,
        lastName: d.basicInfo.lastName,
        dateOfBirth: d.basicInfo.dateOfBirth ? parseDateOnly(d.basicInfo.dateOfBirth) : null,
        gender: genderToDb(d.basicInfo.gender),
        personalEmail: d.contactInfo.personalEmail,
        phone: d.contactInfo.phone || null,
        homeAddress: d.address.homeAddress || null,
      };
      await tx.personalInformation.upsert({ where: { employeeId }, create: { employeeId, ...values }, update: values });
      await tx.employee.update({ where: { id: employeeId }, data: { fullName: `${values.firstName} ${values.lastName}` } });
    } else if (section === "governmentIds") {
      const d = data as GovernmentIdsEditInput;
      const values: Pick<Prisma.PersonalInformationUncheckedCreateInput, "aadhaarNumberEnc" | "panNumberEnc" | "uanNumberEnc"> = {};
      if (d.aadhaar) values.aadhaarNumberEnc = encryptField(d.aadhaar);
      if (d.pan) values.panNumberEnc = encryptField(d.pan);
      if (d.uan) values.uanNumberEnc = encryptField(d.uan);
      changedFields = Object.entries({ aadhaar: d.aadhaar, pan: d.pan, uan: d.uan }).filter(([, v]) => v).map(([k]) => k);
      await tx.personalInformation.upsert({
        where: { employeeId },
        create: { employeeId, ...values },
        update: values,
      });
      await tx.employee.update({ where: { id: employeeId }, data: { updatedAt: new Date() } });
    } else {
      const save = { references: saveReferences, emergencyContact: saveEmergencyContact, healthInsurance: saveHealthInsurance }[section];
      await save(employeeId, data, tx);
      await tx.employee.update({ where: { id: employeeId }, data: { updatedAt: new Date() } });
    }

    await logAdminAction(
      {
        actorAdminId: adminId,
        action: section === "governmentIds" ? "employee.update_ids" : "employee.update",
        entity: "employee",
        entityId: employeeId,
        meta: section === "governmentIds" ? { section, fields: changedFields } : { section },
      },
      tx,
    );
    return { ok: true } as const;
  });
}
