"use client";

import { useReferencesStepLogic } from "@/hooks/steps/useReferencesStepLogic";
import { NocturneTextField } from "../ui/NocturneTextField";
import { NocturneStepShell } from "../NocturneStepShell";
import { NocturneFormSection } from "../NocturneFormSection";

export function ReferencesStepNocturne() {
  const { register, errors, isSubmitting, onContinue } = useReferencesStepLogic();

  return (
    <NocturneStepShell
      stepId="references"
      title="Professional References"
      description="Two people who can speak to your work — a former manager or senior colleague works best."
      onContinue={onContinue}
      isSubmitting={isSubmitting}
    >
      <NocturneFormSection title="Reference 1" first>
        <NocturneTextField
          label="Full name"
          required
          error={errors.primaryReference?.name?.message}
          {...register("primaryReference.name")}
        />
        <NocturneTextField
          label="Relationship"
          placeholder="e.g. Former manager"
          required
          error={errors.primaryReference?.relationship?.message}
          {...register("primaryReference.relationship")}
        />
        <NocturneTextField
          label="Company"
          required
          error={errors.primaryReference?.company?.message}
          {...register("primaryReference.company")}
        />
        <NocturneTextField
          label="Email"
          type="email"
          required
          error={errors.primaryReference?.email?.message}
          {...register("primaryReference.email")}
        />
        <NocturneTextField
          label="Phone number"
          type="tel"
          required
          error={errors.primaryReference?.phone?.message}
          {...register("primaryReference.phone")}
        />
      </NocturneFormSection>

      <NocturneFormSection title="Reference 2">
        <NocturneTextField
          label="Full name"
          required
          error={errors.secondaryReference?.name?.message}
          {...register("secondaryReference.name")}
        />
        <NocturneTextField
          label="Relationship"
          placeholder="e.g. Senior colleague"
          required
          error={errors.secondaryReference?.relationship?.message}
          {...register("secondaryReference.relationship")}
        />
        <NocturneTextField
          label="Company"
          required
          error={errors.secondaryReference?.company?.message}
          {...register("secondaryReference.company")}
        />
        <NocturneTextField
          label="Email"
          type="email"
          required
          error={errors.secondaryReference?.email?.message}
          {...register("secondaryReference.email")}
        />
        <NocturneTextField
          label="Phone number"
          type="tel"
          required
          error={errors.secondaryReference?.phone?.message}
          {...register("secondaryReference.phone")}
        />
      </NocturneFormSection>
    </NocturneStepShell>
  );
}
