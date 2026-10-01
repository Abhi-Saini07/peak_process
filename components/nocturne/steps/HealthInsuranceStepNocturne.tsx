"use client";

import { Plus, Trash2 } from "lucide-react";
import { useHealthInsuranceStepLogic } from "@/hooks/steps/useHealthInsuranceStepLogic";
import { coverageTypeOptions } from "@/lib/schemas/healthInsurance.schema";
import { NocturneTextField } from "../ui/NocturneTextField";
import { NocturneSelectField } from "../ui/NocturneSelectField";
import { NocturneButton } from "../ui/NocturneButton";
import { NocturneStepShell } from "../NocturneStepShell";
import { NocturneFormSection } from "../NocturneFormSection";

export function HealthInsuranceStepNocturne() {
  const { register, errors, isSubmitting, onContinue, fields, append, remove, coverageType, path } =
    useHealthInsuranceStepLogic();

  return (
    <NocturneStepShell stepId="healthInsurance" title="Health Insurance" onContinue={onContinue} isSubmitting={isSubmitting}>
      <NocturneFormSection title="Coverage" first>
        <div className="max-w-sm sm:col-span-2">
          <NocturneSelectField
            label="Coverage type"
            required
            options={[...coverageTypeOptions]}
            error={errors.coverageType?.message}
            {...register("coverageType")}
          />
        </div>
      </NocturneFormSection>

      {coverageType && coverageType !== "self" && (
        <NocturneFormSection title="Dependents" description="Add each spouse or child covered under your plan.">
          <div className="flex flex-col gap-5 sm:col-span-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-4 rounded-2xl border border-nocturne-border p-4 sm:grid-cols-3"
              >
                <NocturneTextField
                  label="Name"
                  required
                  error={errors.dependents?.[index]?.name?.message}
                  {...register(path(`dependents.${index}.name`))}
                />
                <NocturneTextField
                  label="Relationship"
                  placeholder="e.g. Spouse"
                  required
                  error={errors.dependents?.[index]?.relationship?.message}
                  {...register(path(`dependents.${index}.relationship`))}
                />
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <NocturneTextField
                      label="Date of birth"
                      type="date"
                      required
                      error={errors.dependents?.[index]?.dateOfBirth?.message}
                      {...register(path(`dependents.${index}.dateOfBirth`))}
                    />
                  </div>
                  <NocturneButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label="Remove dependent"
                  >
                    <Trash2 className="size-4" />
                  </NocturneButton>
                </div>
              </div>
            ))}
            <NocturneButton
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => append({ name: "", relationship: "", dateOfBirth: "" })}
            >
              <Plus className="size-4" /> Add dependent
            </NocturneButton>
          </div>
        </NocturneFormSection>
      )}

      <NocturneFormSection title="Nominee" description="Who should receive the benefit in an emergency.">
        <NocturneTextField
          label="Nominee name"
          required
          error={errors.nomineeName?.message}
          {...register("nomineeName")}
        />
        <NocturneTextField
          label="Relationship to nominee"
          required
          error={errors.nomineeRelationship?.message}
          {...register("nomineeRelationship")}
        />
      </NocturneFormSection>
    </NocturneStepShell>
  );
}
