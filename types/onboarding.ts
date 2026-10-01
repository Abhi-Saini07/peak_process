import type { WelcomeData } from "@/lib/schemas/welcome.schema";
import type { PersonalInfoData } from "@/lib/schemas/personalInfo.schema";
import type { ReferencesData } from "@/lib/schemas/references.schema";
import type { EmergencyContactData } from "@/lib/schemas/emergencyContact.schema";
import type { HealthInsuranceData } from "@/lib/schemas/healthInsurance.schema";

export type StepId =
  | "welcome"
  | "personalInfo"
  | "references"
  | "emergencyContact"
  | "healthInsurance"
  | "documents"
  | "review";

export type StepStatus = "completed" | "current" | "upcoming" | "blocked";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type DocumentStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "error"
  | "provided";

export interface DocumentMeta {
  id: string;
  docId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  status: DocumentStatus;
  errorMessage?: string;
}

export interface DocumentRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  providedByHR?: boolean;
  acceptedFormats: string[];
  maxSizeMB: number;
}

/** The full shape of onboarding data held in the store and persisted to storage. */
export interface OnboardingDataSnapshot {
  welcome: Partial<WelcomeData>;
  personalInfo: Partial<PersonalInfoData>;
  references: Partial<ReferencesData>;
  emergencyContact: Partial<EmergencyContactData>;
  healthInsurance: Partial<HealthInsuranceData>;
  documents: Record<string, DocumentMeta>;
  submitted: boolean;
  submissionId: string | null;
  submittedAt: string | null;
}
