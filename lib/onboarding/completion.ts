import type { OnboardingDataSnapshot, StepId, StepStatus } from "@/types/onboarding";
import {
  welcomeSchema,
  personalInfoSchema,
  referencesSchema,
  emergencyContactSchema,
  healthInsuranceSchema,
} from "@/lib/schemas/onboardingSchema";
import { DOCUMENT_REQUIREMENTS } from "./documents.config";
import { stepRegistry } from "./steps.config";

function isDocumentsStepComplete(state: OnboardingDataSnapshot): boolean {
  return DOCUMENT_REQUIREMENTS.filter((doc) => doc.required).every((doc) => {
    const entry = state.documents[doc.id];
    return entry?.status === "uploaded" || entry?.status === "provided";
  });
}

/** Whether a step has any saved data at all — used to distinguish "blocked" from "upcoming". */
function isStepTouched(id: StepId, state: OnboardingDataSnapshot): boolean {
  switch (id) {
    case "welcome":
      return Boolean(state.welcome.fullName);
    case "personalInfo":
      return Object.values(state.personalInfo).some(
        (section) => section && Object.values(section).some((v) => v !== undefined && v !== ""),
      );
    case "references":
      return Object.values(state.references).some(
        (ref) => ref && Object.values(ref).some((v) => v !== ""),
      );
    case "emergencyContact":
      return Boolean(state.emergencyContact.name || state.emergencyContact.primaryPhone);
    case "healthInsurance":
      return Boolean(
        state.healthInsurance.coverageType ||
          state.healthInsurance.nomineeName ||
          (state.healthInsurance.dependents?.length ?? 0) > 0,
      );
    case "documents":
      return Object.keys(state.documents).some((id) => state.documents[id].status !== "provided");
    case "review":
      return false;
  }
}

export function isStepComplete(id: StepId, state: OnboardingDataSnapshot): boolean {
  switch (id) {
    case "welcome":
      return welcomeSchema.safeParse(state.welcome).success;
    case "personalInfo":
      return personalInfoSchema.safeParse(state.personalInfo).success;
    case "references":
      return referencesSchema.safeParse(state.references).success;
    case "emergencyContact":
      return emergencyContactSchema.safeParse(state.emergencyContact).success;
    case "healthInsurance":
      return healthInsuranceSchema.safeParse(state.healthInsurance).success;
    case "documents":
      return isDocumentsStepComplete(state);
    case "review":
      return state.submitted;
  }
}

/**
 * Single source of truth for step status, consumed identically by the
 * left-rail StepTimeline, the dashboard's expanded timeline, and the
 * completion percentage — so they can never disagree.
 */
export function computeStepStatuses(state: OnboardingDataSnapshot): Record<StepId, StepStatus> {
  const statuses = {} as Record<StepId, StepStatus>;
  let currentAssigned = false;

  for (const step of stepRegistry) {
    if (isStepComplete(step.id, state)) {
      statuses[step.id] = "completed";
    } else if (!currentAssigned) {
      statuses[step.id] = "current";
      currentAssigned = true;
    } else if (isStepTouched(step.id, state)) {
      statuses[step.id] = "blocked";
    } else {
      statuses[step.id] = "upcoming";
    }
  }

  return statuses;
}

export function computeCompletionPercent(state: OnboardingDataSnapshot): number {
  const statuses = computeStepStatuses(state);
  const completed = Object.values(statuses).filter((s) => s === "completed").length;
  return Math.round((completed / stepRegistry.length) * 100);
}

export function getCurrentStepId(state: OnboardingDataSnapshot): StepId {
  const statuses = computeStepStatuses(state);
  const current = stepRegistry.find((step) => statuses[step.id] === "current");
  return current?.id ?? "review";
}

export function countRequiredDocumentsRemaining(state: OnboardingDataSnapshot): number {
  return DOCUMENT_REQUIREMENTS.filter((doc) => doc.required).filter((doc) => {
    const entry = state.documents[doc.id];
    return !(entry?.status === "uploaded" || entry?.status === "provided");
  }).length;
}
