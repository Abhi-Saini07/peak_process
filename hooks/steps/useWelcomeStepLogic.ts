"use client";

import { useRouter } from "next/navigation";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { welcomeDefaults, welcomeSchema } from "@/lib/schemas/welcome.schema";

/** Presentation-agnostic logic for the Welcome step, shared by all three
 *  design variants — extracted from the original WelcomeStep so Design 1
 *  keeps identical behavior while Design 2/3 reuse the exact same wiring. */
export function useWelcomeStepLogic() {
  const router = useRouter();
  const { form, saveNow } = useOnboardingForm({
    step: "welcome",
    schema: welcomeSchema,
    defaultValues: welcomeDefaults,
  });
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const typedName = watch("fullName");
  const firstName = typedName?.trim().split(/\s+/)[0];

  const onContinue = handleSubmit(async (data) => {
    await saveNow(data);
    router.push("/onboarding/personal-information");
  });

  return { register, errors, isSubmitting, firstName, onContinue };
}
