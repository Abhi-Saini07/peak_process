"use client";

import { ShieldCheck } from "lucide-react";
import { usePersonalInfoStepLogic } from "@/hooks/steps/usePersonalInfoStepLogic";
import { genderOptions } from "@/lib/schemas/shared";
import { NocturneTextField } from "../ui/NocturneTextField";
import { NocturneSelectField } from "../ui/NocturneSelectField";
import { NocturneTextareaField } from "../ui/NocturneTextareaField";
import { NocturneMaskedField } from "../ui/NocturneMaskedField";
import { NocturneHelpPanel, NocturneStepShell } from "../NocturneStepShell";
import { NocturneFormSection } from "../NocturneFormSection";

export function PersonalInfoStepNocturne() {
  const { register, control, errors, isSubmitting, onContinue } = usePersonalInfoStepLogic();

  return (
    <NocturneStepShell
      stepId="personalInfo"
      title="Personal Information"
      description="Let’s get your information in place."
      onContinue={onContinue}
      isSubmitting={isSubmitting}
      aside={
        <NocturneHelpPanel icon={ShieldCheck} title="Your privacy">
          Your information is encrypted and accessible only to authorized HR personnel.
        </NocturneHelpPanel>
      }
    >
      <NocturneFormSection title="Basic information" first>
        <NocturneTextField
          label="First name"
          required
          autoComplete="given-name"
          error={errors.basicInfo?.firstName?.message}
          {...register("basicInfo.firstName")}
        />
        <NocturneTextField
          label="Last name"
          required
          autoComplete="family-name"
          error={errors.basicInfo?.lastName?.message}
          {...register("basicInfo.lastName")}
        />
        <NocturneTextField
          label="Date of birth"
          type="date"
          required
          error={errors.basicInfo?.dateOfBirth?.message}
          {...register("basicInfo.dateOfBirth")}
        />
        <NocturneSelectField
          label="Gender"
          options={[...genderOptions]}
          error={errors.basicInfo?.gender?.message}
          {...register("basicInfo.gender")}
        />
      </NocturneFormSection>

      <NocturneFormSection title="Contact information">
        <NocturneTextField
          label="Personal email"
          type="email"
          required
          placeholder="you@email.com"
          autoComplete="email"
          error={errors.contactInfo?.personalEmail?.message}
          {...register("contactInfo.personalEmail")}
        />
        <NocturneTextField
          label="Phone number"
          type="tel"
          required
          placeholder="+91 98765 43210"
          autoComplete="tel"
          error={errors.contactInfo?.phone?.message}
          {...register("contactInfo.phone")}
        />
      </NocturneFormSection>

      <NocturneFormSection title="Address">
        <div className="sm:col-span-2">
          <NocturneTextareaField
            label="Home address"
            required
            placeholder="Street, City, State, PIN"
            error={errors.address?.homeAddress?.message}
            {...register("address.homeAddress")}
          />
        </div>
      </NocturneFormSection>

      <NocturneFormSection title="Government information">
        <NocturneMaskedField
          control={control}
          name="governmentIds.aadhaar"
          label="Aadhaar number"
          required
          fullLength={12}
          placeholder="XXXX XXXX XXXX"
          error={errors.governmentIds?.aadhaar?.message}
        />
        <NocturneTextField
          label="PAN number"
          required
          placeholder="ABCDE1234F"
          className="uppercase"
          error={errors.governmentIds?.pan?.message}
          {...register("governmentIds.pan", { setValueAs: (v: string) => (v ?? "").toUpperCase() })}
        />
        <div className="max-w-55 sm:col-span-2">
          <NocturneTextField
            label="UAN number"
            placeholder="12-digit UAN"
            helperText="Leave blank if this is your first job."
            error={errors.governmentIds?.uan?.message}
            {...register("governmentIds.uan")}
          />
        </div>
      </NocturneFormSection>
    </NocturneStepShell>
  );
}
