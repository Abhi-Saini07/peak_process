import "server-only";
import {
  Prisma,
  type Gender as PrismaGender,
  type CoverageType as PrismaCoverageType,
  type DocumentType as PrismaDocumentType,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { decryptField, encryptField } from "@/lib/security/encryption";
import { formatDateOnly, parseDateOnly } from "./dateOnly";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";
import {
  onboardingSchema,
  welcomeSchema,
  personalInfoSchema,
  referencesSchema,
  emergencyContactSchema,
  healthInsuranceSchema,
} from "@/lib/schemas/onboardingSchema";
import type { DocumentMeta, DocumentStatus, OnboardingDataSnapshot } from "@/types/onboarding";
import type { SavableStepId } from "@/lib/persistence/types";

type Gender = NonNullable<OnboardingDataSnapshot["personalInfo"]["basicInfo"]>["gender"];
type CoverageType = NonNullable<OnboardingDataSnapshot["healthInsurance"]["coverageType"]>;

// Prisma enum member names can't contain hyphens, so "non-binary" and
// "self-spouse" etc. are stored under underscored identifiers
// (@map'd to the real hyphenated DB values) — these convert between
// Prisma's client-side enum representation and the app's own string
// literals (which match the DB values exactly) at the two read/write
// boundaries below.
const GENDER_FROM_DB: Record<PrismaGender, Gender> = {
  female: "female",
  male: "male",
  non_binary: "non-binary",
  prefer_not_to_say: "prefer-not-to-say",
};
const GENDER_TO_DB: Record<string, PrismaGender> = {
  female: "female",
  male: "male",
  "non-binary": "non_binary",
  "prefer-not-to-say": "prefer_not_to_say",
};

const COVERAGE_FROM_DB: Record<PrismaCoverageType, CoverageType> = {
  self: "self",
  self_spouse: "self-spouse",
  self_family: "self-family",
};
const COVERAGE_TO_DB: Record<string, PrismaCoverageType> = {
  self: "self",
  "self-spouse": "self_spouse",
  "self-family": "self_family",
};

const EMPLOYEE_WITH_RELATIONS = {
  include: {
    personalInformation: true,
    references: true,
    emergencyContact: true,
    healthInsurance: { include: { dependents: true } },
    documents: true,
  },
} satisfies Prisma.EmployeeDefaultArgs;

type EmployeeWithRelations = Prisma.EmployeeGetPayload<typeof EMPLOYEE_WITH_RELATIONS>;

/** Undefined (not null) for an empty/absent value, so the shallow merge in
 *  useOnboardingForm's defaultValues falls back to the section's own
 *  defaults instead of clobbering them with an empty object. */
function nonEmpty<T extends object>(value: T, hasAnyField: boolean): T | undefined {
  return hasAnyField ? value : undefined;
}

function mapSnapshot(employee: EmployeeWithRelations): OnboardingDataSnapshot {
  const pi = employee.personalInformation;
  const primaryRef = employee.references.find((r) => r.referenceType === "primary");
  const secondaryRef = employee.references.find((r) => r.referenceType === "secondary");
  const ec = employee.emergencyContact;
  const hi = employee.healthInsurance;

  const documents: Record<string, DocumentMeta> = {};
  for (const doc of employee.documents) {
    documents[doc.documentType] = {
      id: doc.id,
      docId: doc.documentType,
      fileName: doc.fileName ?? "",
      fileSize: doc.fileSize ?? 0,
      fileType: doc.mimeType ?? "",
      uploadedAt: (doc.uploadedAt ?? doc.updatedAt).toISOString(),
      status: doc.status as DocumentStatus,
      errorMessage: doc.errorMessage ?? undefined,
    };
  }

  return {
    welcome: { fullName: employee.fullName ?? "" },

    personalInfo: {
      basicInfo: nonEmpty(
        {
          firstName: pi?.firstName ?? "",
          lastName: pi?.lastName ?? "",
          dateOfBirth: pi?.dateOfBirth ? formatDateOnly(pi.dateOfBirth) : "",
          gender: pi?.gender ? GENDER_FROM_DB[pi.gender] : undefined,
        },
        Boolean(pi?.firstName || pi?.lastName || pi?.dateOfBirth || pi?.gender),
      ),
      contactInfo: nonEmpty(
        { personalEmail: pi?.personalEmail ?? "", phone: pi?.phone ?? "" },
        Boolean(pi?.personalEmail || pi?.phone),
      ),
      address: nonEmpty({ homeAddress: pi?.homeAddress ?? "" }, Boolean(pi?.homeAddress)),
      governmentIds: nonEmpty(
        {
          aadhaar: decryptField(pi?.aadhaarNumberEnc) ?? "",
          pan: decryptField(pi?.panNumberEnc) ?? "",
          uan: decryptField(pi?.uanNumberEnc) ?? "",
        },
        Boolean(pi?.aadhaarNumberEnc || pi?.panNumberEnc || pi?.uanNumberEnc),
      ),
    },

    references: {
      primaryReference: primaryRef
        ? {
            name: primaryRef.name ?? "",
            relationship: primaryRef.relationship ?? "",
            company: primaryRef.company ?? "",
            email: primaryRef.email ?? "",
            phone: primaryRef.phone ?? "",
          }
        : undefined,
      secondaryReference: secondaryRef
        ? {
            name: secondaryRef.name ?? "",
            relationship: secondaryRef.relationship ?? "",
            company: secondaryRef.company ?? "",
            email: secondaryRef.email ?? "",
            phone: secondaryRef.phone ?? "",
          }
        : undefined,
    },

    emergencyContact: ec
      ? {
          name: ec.name ?? "",
          relationship: ec.relationship ?? "",
          primaryPhone: ec.primaryPhone ?? "",
          secondaryPhone: ec.secondaryPhone ?? "",
          sameAsHomeAddress: ec.sameAsHomeAddress,
          address: ec.address ?? "",
        }
      : {},

    healthInsurance: hi
      ? {
          coverageType: hi.coverageType ? COVERAGE_FROM_DB[hi.coverageType] : undefined,
          dependents: hi.dependents.map((d) => ({
            name: d.name,
            relationship: d.relationship,
            dateOfBirth: formatDateOnly(d.dateOfBirth),
          })),
          nomineeName: hi.nomineeName ?? "",
          nomineeRelationship: hi.nomineeRelationship ?? "",
        }
      : {},

    documents,
    submitted: employee.status === "submitted",
    submissionId: employee.submissionReference,
    submittedAt: employee.submittedAt ? employee.submittedAt.toISOString() : null,
  };
}

export async function getSnapshot(employeeId: string): Promise<OnboardingDataSnapshot> {
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
    ...EMPLOYEE_WITH_RELATIONS,
  });
  return mapSnapshot(employee);
}

// ---------------------------------------------------------------------------
// Per-step saves. These intentionally do NOT enforce the full Zod schemas —
// autosave fires on every keystroke (see hooks/useOnboardingForm.ts), so a
// half-typed Aadhaar number must still be persisted as a draft. Full
// validation happens once, server-side, at submit time (submitOnboarding
// below) — mirroring how the schemas are already used client-side (draft
// autosave vs. gated Continue/Submit).
// ---------------------------------------------------------------------------

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function genderToDb(value: unknown): PrismaGender | null {
  return typeof value === "string" && value in GENDER_TO_DB ? GENDER_TO_DB[value] : null;
}

function coverageToDb(value: unknown): PrismaCoverageType | null {
  return typeof value === "string" && value in COVERAGE_TO_DB ? COVERAGE_TO_DB[value] : null;
}

/** docId strings (identityProof, addressProof, ...) are valid JS
 *  identifiers already matching the Prisma enum 1:1, so no @map/lookup
 *  table is needed here — just a validated cast against the known list. */
function toDocumentType(docId: string): PrismaDocumentType {
  const known = DOCUMENT_REQUIREMENTS.some((req) => req.id === docId);
  if (!known) throw new Error(`Unknown document type: ${docId}`);
  return docId as PrismaDocumentType;
}

export async function saveWelcome(employeeId: string, data: unknown): Promise<void> {
  const fullName = str((data as { fullName?: unknown })?.fullName);
  await prisma.employee.update({ where: { id: employeeId }, data: { fullName } });
}

export async function savePersonalInfo(employeeId: string, data: unknown): Promise<void> {
  const d = (data ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const basic = d.basicInfo ?? {};
  const contact = d.contactInfo ?? {};
  const address = d.address ?? {};
  const gov = d.governmentIds ?? {};

  await prisma.personalInformation.upsert({
    where: { employeeId },
    create: {
      employeeId,
      firstName: str(basic.firstName),
      lastName: str(basic.lastName),
      dateOfBirth: parseDateOnly(String(basic.dateOfBirth ?? "")),
      gender: genderToDb(basic.gender),
      personalEmail: str(contact.personalEmail),
      phone: str(contact.phone),
      homeAddress: str(address.homeAddress),
      aadhaarNumberEnc: encryptField(str(gov.aadhaar)),
      panNumberEnc: encryptField(str(gov.pan)),
      uanNumberEnc: encryptField(str(gov.uan)),
    },
    update: {
      firstName: str(basic.firstName),
      lastName: str(basic.lastName),
      dateOfBirth: parseDateOnly(String(basic.dateOfBirth ?? "")),
      gender: genderToDb(basic.gender),
      personalEmail: str(contact.personalEmail),
      phone: str(contact.phone),
      homeAddress: str(address.homeAddress),
      aadhaarNumberEnc: encryptField(str(gov.aadhaar)),
      panNumberEnc: encryptField(str(gov.pan)),
      uanNumberEnc: encryptField(str(gov.uan)),
    },
  });
}

export async function saveReferences(employeeId: string, data: unknown): Promise<void> {
  const d = (data ?? {}) as Record<string, Record<string, unknown> | undefined>;

  for (const [type, ref] of [
    ["primary", d.primaryReference],
    ["secondary", d.secondaryReference],
  ] as const) {
    const r = ref ?? {};
    await prisma.employeeReference.upsert({
      where: { employeeId_referenceType: { employeeId, referenceType: type } },
      create: {
        employeeId,
        referenceType: type,
        name: str(r.name),
        relationship: str(r.relationship),
        company: str(r.company),
        email: str(r.email),
        phone: str(r.phone),
      },
      update: {
        name: str(r.name),
        relationship: str(r.relationship),
        company: str(r.company),
        email: str(r.email),
        phone: str(r.phone),
      },
    });
  }
}

export async function saveEmergencyContact(employeeId: string, data: unknown): Promise<void> {
  const d = (data ?? {}) as Record<string, unknown>;
  const payload = {
    name: str(d.name),
    relationship: str(d.relationship),
    primaryPhone: str(d.primaryPhone),
    secondaryPhone: str(d.secondaryPhone),
    sameAsHomeAddress: Boolean(d.sameAsHomeAddress),
    address: str(d.address),
  };
  await prisma.emergencyContact.upsert({
    where: { employeeId },
    create: { employeeId, ...payload },
    update: payload,
  });
}

export async function saveHealthInsurance(employeeId: string, data: unknown): Promise<void> {
  const d = (data ?? {}) as Record<string, unknown>;
  const coverageType = coverageToDb(d.coverageType);
  const dependents = Array.isArray(d.dependents) ? d.dependents.slice(0, 5) : [];

  await prisma.$transaction([
    prisma.healthInsurance.upsert({
      where: { employeeId },
      create: {
        employeeId,
        coverageType,
        nomineeName: str(d.nomineeName),
        nomineeRelationship: str(d.nomineeRelationship),
      },
      update: {
        coverageType,
        nomineeName: str(d.nomineeName),
        nomineeRelationship: str(d.nomineeRelationship),
      },
    }),
    prisma.healthInsuranceDependent.deleteMany({ where: { employeeId } }),
    ...(dependents.length > 0
      ? [
          prisma.healthInsuranceDependent.createMany({
            data: dependents.map((dep) => {
              const dd = (dep ?? {}) as Record<string, unknown>;
              return {
                employeeId,
                name: String(dd.name ?? ""),
                relationship: String(dd.relationship ?? ""),
                dateOfBirth: parseDateOnly(String(dd.dateOfBirth ?? "")) ?? new Date(0),
              };
            }),
          }),
        ]
      : []),
  ]);
}

const STEP_SAVERS: Record<Exclude<SavableStepId, "documents">, (employeeId: string, data: unknown) => Promise<void>> = {
  welcome: saveWelcome,
  personalInfo: savePersonalInfo,
  references: saveReferences,
  emergencyContact: saveEmergencyContact,
  healthInsurance: saveHealthInsurance,
};

export async function saveStep(employeeId: string, step: SavableStepId, data: unknown): Promise<void> {
  if (step === "documents") {
    // DocumentsStep never calls the generic saveStep — uploads/removals go
    // through their own endpoints (see app/api/onboarding/documents).
    return;
  }
  await STEP_SAVERS[step](employeeId, data);
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function upsertDocumentMeta(
  employeeId: string,
  docId: string,
  meta: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    storagePath?: string | null;
    status: DocumentStatus;
    errorMessage?: string | null;
    uploadedAt?: Date | null;
  },
): Promise<DocumentMeta> {
  const documentType = toDocumentType(docId);
  const row = await prisma.employeeDocument.upsert({
    where: { employeeId_documentType: { employeeId, documentType } },
    create: {
      employeeId,
      documentType,
      fileName: meta.fileName ?? null,
      fileSize: meta.fileSize ?? null,
      mimeType: meta.mimeType ?? null,
      storagePath: meta.storagePath ?? null,
      status: meta.status,
      errorMessage: meta.errorMessage ?? null,
      uploadedAt: meta.uploadedAt ?? null,
    },
    update: {
      fileName: meta.fileName ?? null,
      fileSize: meta.fileSize ?? null,
      mimeType: meta.mimeType ?? null,
      storagePath: meta.storagePath ?? null,
      status: meta.status,
      errorMessage: meta.errorMessage ?? null,
      uploadedAt: meta.uploadedAt ?? null,
    },
  });

  return {
    id: row.id,
    docId: row.documentType,
    fileName: row.fileName ?? "",
    fileSize: row.fileSize ?? 0,
    fileType: row.mimeType ?? "",
    uploadedAt: (row.uploadedAt ?? row.updatedAt).toISOString(),
    status: row.status as DocumentStatus,
    errorMessage: row.errorMessage ?? undefined,
  };
}

export async function removeDocument(employeeId: string, docId: string): Promise<void> {
  await prisma.employeeDocument.deleteMany({
    where: { employeeId, documentType: toDocumentType(docId) },
  });
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

/**
 * Re-validates every section server-side with the same Zod schemas the
 * frontend uses, rather than trusting whatever the client claims is valid.
 * The old localStorage mock trusted the client-provided snapshot wholesale
 * (see lib/persistence/localOnboardingClient.ts) — this is the one place
 * where moving to a real backend makes the app strictly more correct, not
 * just persistent.
 */
export async function submitOnboarding(
  employeeId: string,
): Promise<{ submissionId: string; submittedAt: string } | { error: string }> {
  const snapshot = await getSnapshot(employeeId);

  const requiredDocsOk = DOCUMENT_REQUIREMENTS.filter((d) => d.required).every((d) => {
    const entry = snapshot.documents[d.id];
    return entry?.status === "uploaded" || entry?.status === "provided";
  });

  const sectionsValid =
    welcomeSchema.safeParse(snapshot.welcome).success &&
    personalInfoSchema.safeParse(snapshot.personalInfo).success &&
    referencesSchema.safeParse(snapshot.references).success &&
    emergencyContactSchema.safeParse(snapshot.emergencyContact).success &&
    healthInsuranceSchema.safeParse(snapshot.healthInsurance).success &&
    requiredDocsOk;

  if (!sectionsValid) {
    return { error: "Some sections are incomplete. Please review and finish every step before submitting." };
  }

  // Retry once on the (astronomically unlikely) chance of a reference
  // collision, guarded by the UNIQUE constraint on submission_reference.
  for (let attempt = 0; attempt < 2; attempt++) {
    const submissionId = `PPP-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
    try {
      const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: { status: "submitted", submissionReference: submissionId, submittedAt: new Date() },
      });
      return { submissionId, submittedAt: updated.submittedAt!.toISOString() };
    } catch (err) {
      const isUniqueViolation =
        typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === "P2002";
      if (!isUniqueViolation || attempt === 1) {
        return { error: "Submission failed. Please try again." };
      }
    }
  }
  return { error: "Submission failed. Please try again." };
}

export async function resetOnboarding(employeeId: string): Promise<void> {
  await prisma.$transaction([
    prisma.healthInsuranceDependent.deleteMany({ where: { employeeId } }),
    prisma.healthInsurance.deleteMany({ where: { employeeId } }),
    prisma.emergencyContact.deleteMany({ where: { employeeId } }),
    prisma.employeeReference.deleteMany({ where: { employeeId } }),
    prisma.employeeDocument.deleteMany({ where: { employeeId } }),
    prisma.personalInformation.deleteMany({ where: { employeeId } }),
    prisma.employee.update({
      where: { id: employeeId },
      data: { fullName: null, status: "in_progress", submissionReference: null, submittedAt: null },
    }),
  ]);
}

// Re-export for routes that want the composed schema for other checks.
export { onboardingSchema };
