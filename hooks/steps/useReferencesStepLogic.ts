"use client";

import { useRouter } from "next/navigation";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { referencesDefaults, referencesSchema } from "@/lib/schemas/references.schema";

export function useReferencesStepLogic() {
  const router = useRouter();
  const { form, saveNow } = useOnboardingForm({
    step: "references",
    schema: referencesSchema,
    defaultValues: referencesDefaults,
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onContinue = handleSubmit(async (data) => {
    await saveNow(data);
    router.push("/onboarding/emergency-contact");
  });

  return { register, errors, isSubmitting, onContinue };
}
