import type { DocumentMeta, OnboardingDataSnapshot, StepId } from "@/types/onboarding";

export type SavableStepId = Exclude<StepId, "review">;

export interface OnboardingClient {
  getState(): Promise<OnboardingDataSnapshot | null>;
  saveStep(step: SavableStepId, data: unknown): Promise<{ savedAt: string }>;
  uploadDocument(
    file: File,
    docId: string,
    onProgress?: (percent: number) => void,
  ): Promise<DocumentMeta>;
  removeDocument(docId: string): Promise<void>;
  submit(finalData: OnboardingDataSnapshot): Promise<{ submissionId: string; submittedAt: string }>;
  reset(): Promise<void>;
}
