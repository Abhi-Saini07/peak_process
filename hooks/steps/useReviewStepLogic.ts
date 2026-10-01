"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { useStepStatuses } from "@/lib/store/selectors";
import { stepRegistry } from "@/lib/onboarding/steps.config";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";
import { coverageTypeOptions } from "@/lib/schemas/healthInsurance.schema";

function coverageLabel(value?: string): string | undefined {
  return coverageTypeOptions.find((o) => o.value === value)?.label;
}

export function useReviewStepLogic() {
  const router = useRouter();
  const statuses = useStepStatuses();
  const submitOnboarding = useOnboardingStore((s) => s.submitOnboarding);
  const welcome = useOnboardingStore((s) => s.welcome);
  const personalInfo = useOnboardingStore((s) => s.personalInfo);
  const references = useOnboardingStore((s) => s.references);
  const emergencyContact = useOnboardingStore((s) => s.emergencyContact);
  const healthInsurance = useOnboardingStore((s) => s.healthInsurance);
  const documents = useOnboardingStore((s) => s.documents);

  const [confirmed, setConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewSteps = stepRegistry.filter((step) => step.id !== "review");
  const allOtherComplete = reviewSteps.every((step) => statuses[step.id] === "completed");
  const uploadedDocsCount = Object.values(documents).filter(
    (d) => d.status === "uploaded" || d.status === "provided",
  ).length;

  const summaries: Partial<Record<string, string | undefined>> = {
    welcome: welcome.fullName,
    personalInfo: personalInfo.contactInfo?.personalEmail,
    references:
      references.primaryReference?.name && references.secondaryReference?.name
        ? `${references.primaryReference.name}, ${references.secondaryReference.name}`
        : undefined,
    emergencyContact: emergencyContact.name,
    healthInsurance: coverageLabel(healthInsurance.coverageType),
    documents: `${uploadedDocsCount}/${DOCUMENT_REQUIREMENTS.length} uploaded`,
  };

  const onSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    const result = await submitOnboarding();
    setIsSubmitting(false);
    if ("error" in result) {
      setSubmitError(result.error);
    } else {
      router.push("/onboarding/complete");
    }
  };

  return {
    statuses,
    reviewSteps,
    allOtherComplete,
    summaries,
    confirmed,
    setConfirmed,
    submitError,
    isSubmitting,
    onSubmit,
  };
}
