"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, type Path } from "react-hook-form";
import { useOnboardingForm } from "@/hooks/useOnboardingForm";
import {
  healthInsuranceDefaults,
  healthInsuranceSchema,
  type HealthInsuranceData,
} from "@/lib/schemas/healthInsurance.schema";

export function useHealthInsuranceStepLogic() {
  const router = useRouter();
  const { form, saveNow } = useOnboardingForm({
    step: "healthInsurance",
    schema: healthInsuranceSchema,
    defaultValues: healthInsuranceDefaults,
  });
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "dependents" });

  const coverageType = watch("coverageType");

  const onContinue = handleSubmit(async (data) => {
    await saveNow(data);
    router.push("/onboarding/documents");
  });

  const path = (p: string) => p as Path<HealthInsuranceData>;

  return { register, control, errors, isSubmitting, onContinue, fields, append, remove, coverageType, path };
}
