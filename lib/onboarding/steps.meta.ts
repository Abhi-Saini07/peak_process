import type { StepId } from "@/types/onboarding";

/**
 * The onboarding steps as plain data (no UI), so server code and pure
 * helpers (completion %, onboarding links, admin views) can use them without
 * importing the step components. steps.config.ts adds the components.
 */
export interface StepMeta {
  id: StepId;
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const STEP_META: readonly StepMeta[] = [
  {
    id: "welcome",
    slug: "welcome",
    label: "Welcome",
    shortLabel: "Welcome",
    description: "A quick introduction before we begin.",
  },
  {
    id: "personalInfo",
    slug: "personal-information",
    label: "Personal Information",
    shortLabel: "Personal Info",
    description: "Basic details, contact information, and government IDs.",
  },
  {
    id: "references",
    slug: "references",
    label: "References",
    shortLabel: "References",
    description: "Two professional references we can reach out to.",
  },
  {
    id: "emergencyContact",
    slug: "emergency-contact",
    label: "Emergency Contact",
    shortLabel: "Emergency Contact",
    description: "Who we should contact in case of an emergency.",
  },
  {
    id: "healthInsurance",
    slug: "health-insurance",
    label: "Health Insurance",
    shortLabel: "Health Insurance",
    description: "Coverage type, dependents, and nominee details.",
  },
  {
    id: "documents",
    slug: "documents",
    label: "Documents",
    shortLabel: "Documents",
    description: "Upload the documents required to complete your file.",
  },
  {
    id: "review",
    slug: "review",
    label: "Review & Submit",
    shortLabel: "Review",
    description: "Confirm everything looks right before you submit.",
  },
];

export const FIRST_STEP_SLUG = STEP_META[0].slug;
