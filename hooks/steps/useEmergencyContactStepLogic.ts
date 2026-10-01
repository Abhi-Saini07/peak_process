"use client";

import { useRouter } from "next/navigation";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { emergencyContactDefaults, emergencyContactSchema } from "@/lib/schemas/emergencyContact.schema";
import { useOnboardingStore } from "@/lib/store/onboardingStore";

export function useEmergencyContactStepLogic() {
  const router = useRouter();
  const homeAddress = useOnboardingStore((s) => s.personalInfo.address?.homeAddress);
  const { form, saveNow } = useOnboardingForm({
    step: "emergencyContact",
    schema: emergencyContactSchema,
    defaultValues: emergencyContactDefaults,
  });
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const sameAsHomeAddress = watch("sameAsHomeAddress");

  const onContinue = handleSubmit(async (data) => {
    await saveNow(data);
    router.push("/onboarding/health-insurance");
  });

  return { register, errors, isSubmitting, onContinue, sameAsHomeAddress, homeAddress };
}
