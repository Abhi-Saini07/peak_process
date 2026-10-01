import { useEffect } from "react";
import { useForm, type DefaultValues, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import type { SavableStepId } from "@/lib/persistence/types";
import { useDebouncedCallback } from "./useDebouncedCallback";

interface UseOnboardingFormOptions<TSchema extends z.ZodType<FieldValues, FieldValues>> {
  step: SavableStepId;
  schema: TSchema;
  defaultValues: DefaultValues<z.infer<TSchema>>;
}

/**
 * Shared per-step form hook: wires react-hook-form + zod validation to the
 * step's slice of the onboarding store, and autosaves on every change
 * (debounced) regardless of validity so a half-filled step survives a
 * reload. Advancing to the next step still requires a valid submit.
 */
export function useOnboardingForm<TSchema extends z.ZodType<FieldValues, FieldValues>>({
  step,
  schema,
  defaultValues,
}: UseOnboardingFormOptions<TSchema>) {
  type FormValues = z.infer<TSchema>;

  const storedValue = useOnboardingStore((s) => s[step]);
  const saveStep = useOnboardingStore((s) => s.saveStep);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { ...defaultValues, ...storedValue } as DefaultValues<FormValues>,
    mode: "onBlur",
  });

  const debouncedSave = useDebouncedCallback((data: unknown) => {
    void saveStep(step, data);
  }, 600);

  useEffect(() => {
    const subscription = form.watch((value) => debouncedSave(value));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSave]);

  const saveNow = (data: FormValues) => saveStep(step, data);

  return { form, saveNow };
}
