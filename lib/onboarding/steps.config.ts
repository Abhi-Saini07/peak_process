import type { ComponentType } from "react";
import type { StepId } from "@/types/onboarding";
import { STEP_META, type StepMeta } from "./steps.meta";
import { WelcomeStepNocturne } from "@/components/nocturne/steps/WelcomeStepNocturne";
import { PersonalInfoStepNocturne } from "@/components/nocturne/steps/PersonalInfoStepNocturne";
import { ReferencesStepNocturne } from "@/components/nocturne/steps/ReferencesStepNocturne";
import { EmergencyContactStepNocturne } from "@/components/nocturne/steps/EmergencyContactStepNocturne";
import { HealthInsuranceStepNocturne } from "@/components/nocturne/steps/HealthInsuranceStepNocturne";
import { DocumentsStepNocturne } from "@/components/nocturne/steps/DocumentsStepNocturne";
import { ReviewStepNocturne } from "@/components/nocturne/steps/ReviewStepNocturne";

export interface StepConfig extends StepMeta {
  Component: ComponentType;
}

const COMPONENTS: Record<StepId, ComponentType> = {
  welcome: WelcomeStepNocturne,
  personalInfo: PersonalInfoStepNocturne,
  references: ReferencesStepNocturne,
  emergencyContact: EmergencyContactStepNocturne,
  healthInsurance: HealthInsuranceStepNocturne,
  documents: DocumentsStepNocturne,
  review: ReviewStepNocturne,
};

export const stepRegistry: StepConfig[] = STEP_META.map((meta) => ({ ...meta, Component: COMPONENTS[meta.id] }));

export function getStepBySlug(slug: string): StepConfig | undefined {
  return stepRegistry.find((step) => step.slug === slug);
}

export function getStepById(id: StepId): StepConfig {
  const step = stepRegistry.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown step id: ${id}`);
  return step;
}

export function getStepIndex(id: StepId): number {
  return stepRegistry.findIndex((step) => step.id === id);
}

export function getAdjacentSlug(id: StepId, direction: 1 | -1): string | null {
  const index = getStepIndex(id);
  const target = stepRegistry[index + direction];
  return target ? target.slug : null;
}
