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
  /** The first onboarding step that isn't done yet (null once everything is filled in). */
  nextStep: string | null;
  /** The latest onboarding link: none sent, waiting to be opened, opened, or expired unopened. */
  link: { state: "none" | "sent" | "opened" | "expired"; at: string | null };
  createdAt: string;
  updatedAt: string;
}

/** The two admin People lists: new hires still onboarding, and people who finished. */
export type PeopleGroup = "onboarding" | "employees";

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
