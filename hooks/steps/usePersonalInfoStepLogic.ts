"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import { personalInfoDefaults, personalInfoSchema } from "@/lib/schemas/personalInfo.schema";
import { useOnboardingStore } from "@/lib/store/onboardingStore";

export function usePersonalInfoStepLogic() {
  const router = useRouter();
  const welcomeFullName = useOnboardingStore((s) => s.welcome.fullName);
  const { form, saveNow } = useOnboardingForm({
    step: "personalInfo",
    schema: personalInfoSchema,
    defaultValues: personalInfoDefaults,
  });
  const {
    register,
    control,
    getValues,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  // Carry the name from Welcome into these fields instead of asking twice —
  // but only as a starting point, never overwriting something already typed here.
  useEffect(() => {
    if (!welcomeFullName) return;
    const hasFirst = Boolean(getValues("basicInfo.firstName"));
    const hasLast = Boolean(getValues("basicInfo.lastName"));
    if (hasFirst || hasLast) return;

    const [first, ...rest] = welcomeFullName.trim().split(/\s+/);
    if (first) setValue("basicInfo.firstName", first, { shouldDirty: false });
    if (rest.length) setValue("basicInfo.lastName", rest.join(" "), { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeFullName]);

  const onContinue = handleSubmit(async (data) => {
    await saveNow(data);
    router.push("/onboarding/references");
  });

  return { register, control, errors, isSubmitting, onContinue };
}
