import { useShallow } from "zustand/react/shallow";
import type { OnboardingDataSnapshot, StepStatus } from "@/types/onboarding";
import {
  computeCompletionPercent,
  computeStepStatuses,
  countRequiredDocumentsRemaining,
  getCurrentStepId,
} from "@/lib/onboarding/completion";
import { useOnboardingStore } from "./onboardingStore";

function toSnapshot(s: OnboardingDataSnapshot): OnboardingDataSnapshot {
  return {
    welcome: s.welcome,
    personalInfo: s.personalInfo,
    references: s.references,
    emergencyContact: s.emergencyContact,
    healthInsurance: s.healthInsurance,
    documents: s.documents,
    submitted: s.submitted,
    submissionId: s.submissionId,
    submittedAt: s.submittedAt,
  };
}

export function useStepStatuses(): Record<string, StepStatus> {
  return useOnboardingStore(useShallow((s) => computeStepStatuses(toSnapshot(s))));
}

export function useCompletionPercent(): number {
  return useOnboardingStore((s) => computeCompletionPercent(toSnapshot(s)));
}

export function useCurrentStepId() {
  return useOnboardingStore((s) => getCurrentStepId(toSnapshot(s)));
}

export function useRequiredDocumentsRemaining(): number {
  return useOnboardingStore((s) => countRequiredDocumentsRemaining(toSnapshot(s)));
}

export function useSaveMeta() {
  return useOnboardingStore(
    useShallow((s) => ({
      saveStatus: s.saveStatus,
      saveError: s.saveError,
      lastSavedAt: s.lastSavedAt,
    })),
  );
}

export function useFullName(): string {
  return useOnboardingStore((s) => s.welcome.fullName ?? "");
}
