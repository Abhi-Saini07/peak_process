import type { DocumentMeta, OnboardingDataSnapshot, StepId, StepStatus } from "@/types/onboarding";

export interface EmployeeSummary {
  id: string;
  name: string;
  email: string | null;
  status: "in_progress" | "submitted";
  completionPercent: number;
  submissionReference: string | null;
  submittedAt: string | null;
  /** Set when this person was hired through the recruitment pipeline. */
  hiredFor: { applicationId: string; jobTitle: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type GovernmentIds = { aadhaar: string | null; pan: string | null; uan: string | null };

export interface EmployeeDetail extends EmployeeSummary {
  steps: { id: StepId; label: string; status: StepStatus }[];
  /** Personal information WITHOUT governmentIds (see maskedIds). */
  personalInfo: Omit<OnboardingDataSnapshot["personalInfo"], "governmentIds"> & { governmentIds?: undefined };
  maskedIds: { aadhaar: string | null; pan: string | null; uan: string | null };
  references: OnboardingDataSnapshot["references"];
  emergencyContact: OnboardingDataSnapshot["emergencyContact"];
  healthInsurance: OnboardingDataSnapshot["healthInsurance"];
  documents: DocumentMeta[];
  latestInvite: { createdAt: string; expiresAt: string; usedAt: string | null } | null;
}
