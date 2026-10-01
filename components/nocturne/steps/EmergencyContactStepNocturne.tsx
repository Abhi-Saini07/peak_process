"use client";

import { useEmergencyContactStepLogic } from "@/hooks/steps/useEmergencyContactStepLogic";
import { NocturneTextField } from "../ui/NocturneTextField";
import { NocturneTextareaField } from "../ui/NocturneTextareaField";
import { NocturneCheckbox } from "../ui/NocturneCheckbox";
import { NocturneStepShell } from "../NocturneStepShell";
import { NocturneFormSection } from "../NocturneFormSection";

export function EmergencyContactStepNocturne() {
  const { register, errors, isSubmitting, onContinue, sameAsHomeAddress, homeAddress } =
    useEmergencyContactStepLogic();

  return (
    <NocturneStepShell
      stepId="emergencyContact"
      title="Emergency Contact"
      onContinue={onContinue}
      isSubmitting={isSubmitting}
    >
      <NocturneFormSection title="Contact details" first>
        <NocturneTextField label="Full name" required error={errors.name?.message} {...register("name")} />
        <NocturneTextField
          label="Relationship"
          placeholder="e.g. Spouse, Parent, Sibling"
          required
          error={errors.relationship?.message}
          {...register("relationship")}
        />
        <NocturneTextField
          label="Primary phone"
          type="tel"
          required
          error={errors.primaryPhone?.message}
          {...register("primaryPhone")}
        />
        <NocturneTextField
          label="Secondary phone"
          type="tel"
          helperText="Optional"
          error={errors.secondaryPhone?.message}
          {...register("secondaryPhone")}
        />
      </NocturneFormSection>

      <NocturneFormSection title="Address">
        <div className="flex flex-col gap-4 sm:col-span-2">
          <NocturneCheckbox label="Same as my home address" {...register("sameAsHomeAddress")} />
          {sameAsHomeAddress ? (
            homeAddress ? (
              <p className="rounded-nocturne-control bg-nocturne-raised px-4 py-3 text-sm text-nocturne-ink-muted">
                {homeAddress}
              </p>
            ) : (
              <p className="text-sm text-nocturne-ink-faint">Add your home address in Personal Information first.</p>
            )
          ) : (
            <NocturneTextareaField
              label="Address"
              required
              placeholder="Street, City, State, PIN"
              error={errors.address?.message}
              {...register("address")}
            />
          )}
        </div>
      </NocturneFormSection>
    </NocturneStepShell>
  );
}
