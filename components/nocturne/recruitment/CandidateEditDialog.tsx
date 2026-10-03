"use client";

import { EDUCATION_OPTIONS } from "@/lib/recruitment/constants";
import type { CandidateEdit } from "@/hooks/recruitment/useCandidateEdit";
import { NocturneDialog } from "@/components/nocturne/ui/NocturneDialog";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { NocturneTextField } from "@/components/nocturne/ui/NocturneTextField";
import { NocturneSelectField } from "@/components/nocturne/ui/NocturneSelectField";

/** HR corrects a candidate's details. Applies to all of the candidate's applications. */
export function CandidateEditDialog({ edit, candidateName }: { edit: CandidateEdit; candidateName: string }) {
  const { register, errors } = edit;
  return (
    <NocturneDialog open={edit.isOpen} onClose={edit.close} eyebrow="Edit candidate" title={candidateName} className="max-w-xl">
      {() => (
        <form noValidate onSubmit={edit.submit} className="flex flex-col gap-1">
          <p className="mb-2 text-sm text-nocturne-ink-muted">Changes apply to every application from this candidate and are recorded in the audit log.</p>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <NocturneTextField id="cand-first" label="First name" required error={errors.firstName?.message} {...register("firstName")} />
            <NocturneTextField id="cand-last" label="Last name" required error={errors.lastName?.message} {...register("lastName")} />
            <NocturneTextField id="cand-email" label="Email" type="email" required error={errors.email?.message} {...register("email")} />
            <NocturneTextField id="cand-phone" label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
            <NocturneTextField id="cand-location" label="Location" error={errors.location?.message} {...register("location")} />
            <NocturneTextField id="cand-exp" label="Years of experience" type="number" min={0} max={60} inputMode="numeric" error={errors.experienceYears?.message} {...register("experienceYears")} />
          </div>
          <NocturneSelectField id="cand-edu" label="Highest education" placeholder="Not given" options={[...EDUCATION_OPTIONS]} error={errors.education?.message} {...register("education")} />
          <NocturneTextField id="cand-linkedin" label="LinkedIn" type="url" placeholder="https://linkedin.com/in/…" error={errors.linkedinUrl?.message} {...register("linkedinUrl")} />
          <NocturneTextField id="cand-portfolio" label="Portfolio / website" type="url" error={errors.portfolioUrl?.message} {...register("portfolioUrl")} />
          {edit.serverError && (
            <p role="alert" className="text-sm text-nocturne-error">
              {edit.serverError}
            </p>
          )}
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <NocturneButton type="button" variant="secondary" size="sm" onClick={edit.close} disabled={edit.isSubmitting}>
              Cancel
            </NocturneButton>
            <NocturneButton type="submit" size="sm" isLoading={edit.isSubmitting}>
              Save changes
            </NocturneButton>
          </div>
        </form>
      )}
    </NocturneDialog>
  );
}
