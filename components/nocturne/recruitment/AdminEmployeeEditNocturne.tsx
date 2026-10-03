"use client";

import Link from "next/link";
import { useFieldArray, type FieldValues } from "react-hook-form";
import { ArrowLeft, Check, Info, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { genderOptions } from "@/lib/schemas/shared";
import { coverageTypeOptions, type HealthInsuranceData } from "@/lib/schemas/healthInsurance.schema";
import type { ReferencesData } from "@/lib/schemas/references.schema";
import type { EmergencyContactData } from "@/lib/schemas/emergencyContact.schema";
import type { GovernmentIdsEditInput, PersonalEditInput } from "@/lib/onboarding/employeeEdit";
import { useEmployeeSectionForm, type EmployeeSectionForm } from "@/hooks/recruitment/useEmployeeEdit";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { NocturneTextField } from "@/components/nocturne/ui/NocturneTextField";
import { NocturneSelectField } from "@/components/nocturne/ui/NocturneSelectField";
import { NocturneTextareaField } from "@/components/nocturne/ui/NocturneTextareaField";
import { NocturneCheckbox } from "@/components/nocturne/ui/NocturneCheckbox";
import { AdminPageHeading, adminCardTitleClass, adminLabelClass, adminPanelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { EmployeeDetail } from "@/types/employees";

const backLinkClass =
  "mb-4 inline-flex h-8 items-center gap-1.5 rounded-nocturne-pill border border-nocturne-border bg-nocturne-card pr-3.5 pl-2.5 text-[0.8125rem] font-semibold text-nocturne-ink-muted shadow-nocturne-rest transition-colors hover:border-nocturne-border-strong hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent";

/** A section card: its own <form>, Save button and saved/error state. */
function SectionCard<T extends FieldValues>({
  title,
  description,
  section,
  children,
}: {
  title: string;
  description?: string;
  section: EmployeeSectionForm<T>;
  children: React.ReactNode;
}) {
  return (
    <form noValidate onSubmit={section.submit} className={cn(adminPanelClass, "px-4 py-5.5 sm:px-6.5")} aria-label={title}>
      <h2 className={adminCardTitleClass}>{title}</h2>
      {description && <p className="mt-1 text-sm text-nocturne-ink-muted">{description}</p>}
      <div className="mt-4 grid grid-cols-1 gap-x-5 sm:grid-cols-2">{children}</div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t border-nocturne-border pt-4">
        {section.serverError && (
          <p role="alert" className="mr-auto text-sm text-nocturne-error">
            {section.serverError}
          </p>
        )}
        {section.saved && (
          <p role="status" className="mr-auto inline-flex items-center gap-1.5 text-sm font-semibold text-nocturne-success">
            <Check className="size-4" aria-hidden />
            Saved
          </p>
        )}
        <NocturneButton type="submit" size="sm" isLoading={section.isSubmitting} disabled={!section.isDirty}>
          Save {title.toLowerCase()}
        </NocturneButton>
      </div>
    </form>
  );
}

const full = "sm:col-span-2";

function PersonalSection({ employee }: { employee: EmployeeDetail }) {
  const pi = employee.personalInfo;
  const section = useEmployeeSectionForm<PersonalEditInput>(employee.id, "personal", {
    basicInfo: {
      firstName: pi.basicInfo?.firstName ?? "",
      lastName: pi.basicInfo?.lastName ?? "",
      dateOfBirth: pi.basicInfo?.dateOfBirth ?? "",
      gender: pi.basicInfo?.gender ?? "",
    },
    contactInfo: { personalEmail: pi.contactInfo?.personalEmail ?? "", phone: pi.contactInfo?.phone ?? "" },
    address: { homeAddress: pi.address?.homeAddress ?? "" },
  });
  const { register } = section.form;
  return (
    <SectionCard title="Personal information" section={section}>
      <NocturneTextField id="pi-first" label="First name" required error={section.errorFor("basicInfo.firstName")} {...register("basicInfo.firstName")} />
      <NocturneTextField id="pi-last" label="Last name" required error={section.errorFor("basicInfo.lastName")} {...register("basicInfo.lastName")} />
      <NocturneTextField id="pi-dob" label="Date of birth" type="date" className="nocturne-mono" error={section.errorFor("basicInfo.dateOfBirth")} {...register("basicInfo.dateOfBirth")} />
      <NocturneSelectField id="pi-gender" label="Gender" placeholder="Not given" options={[...genderOptions]} error={section.errorFor("basicInfo.gender")} {...register("basicInfo.gender")} />
      <NocturneTextField id="pi-email" label="Personal email" type="email" required error={section.errorFor("contactInfo.personalEmail")} {...register("contactInfo.personalEmail")} />
      <NocturneTextField id="pi-phone" label="Phone" type="tel" error={section.errorFor("contactInfo.phone")} {...register("contactInfo.phone")} />
      <div className={full}>
        <NocturneTextareaField id="pi-address" label="Home address" rows={3} error={section.errorFor("address.homeAddress")} {...register("address.homeAddress")} />
      </div>
    </SectionCard>
  );
}

function GovernmentIdsSection({ employee }: { employee: EmployeeDetail }) {
  const section = useEmployeeSectionForm<GovernmentIdsEditInput>(employee.id, "governmentIds", { aadhaar: "", pan: "", uan: "" });
  const { register } = section.form;
  const current = (masked: string | null) => (masked ? `Current: ${masked}. Leave blank to keep it.` : "None on file.");
  return (
    <SectionCard
      title="Government IDs"
      description="For privacy the current numbers aren't shown here. Type a new number only for the ones you want to replace; each change is recorded in the audit log."
      section={section}
    >
      <NocturneTextField id="gov-aadhaar" label="New Aadhaar number" inputMode="numeric" maxLength={12} autoComplete="off" className="nocturne-mono" helperText={current(employee.maskedIds.aadhaar)} error={section.errorFor("aadhaar")} {...register("aadhaar")} />
      <NocturneTextField id="gov-pan" label="New PAN" maxLength={10} autoComplete="off" className="nocturne-mono uppercase" helperText={current(employee.maskedIds.pan)} error={section.errorFor("pan")} {...register("pan")} />
      <NocturneTextField id="gov-uan" label="New UAN" inputMode="numeric" maxLength={12} autoComplete="off" className="nocturne-mono" helperText={current(employee.maskedIds.uan)} error={section.errorFor("uan")} {...register("uan")} />
    </SectionCard>
  );
}

const emptyRef = { name: "", relationship: "", company: "", email: "", phone: "" };

function ReferencesSection({ employee }: { employee: EmployeeDetail }) {
  const r = employee.references;
  const section = useEmployeeSectionForm<ReferencesData>(employee.id, "references", {
    primaryReference: { ...emptyRef, ...r.primaryReference },
    secondaryReference: { ...emptyRef, ...r.secondaryReference },
  });
  const { register } = section.form;
  return (
    <SectionCard title="References" section={section}>
      {(["primaryReference", "secondaryReference"] as const).map((key) => (
        <fieldset key={key} className="flex flex-col">
          <legend className={cn(adminLabelClass, "mb-3")}>{key === "primaryReference" ? "Primary" : "Secondary"}</legend>
          <NocturneTextField id={`${key}-name`} label="Name" required error={section.errorFor(`${key}.name`)} {...register(`${key}.name`)} />
          <NocturneTextField id={`${key}-rel`} label="Relationship" required error={section.errorFor(`${key}.relationship`)} {...register(`${key}.relationship`)} />
          <NocturneTextField id={`${key}-company`} label="Company" required error={section.errorFor(`${key}.company`)} {...register(`${key}.company`)} />
          <NocturneTextField id={`${key}-email`} label="Email" type="email" required error={section.errorFor(`${key}.email`)} {...register(`${key}.email`)} />
          <NocturneTextField id={`${key}-phone`} label="Phone" type="tel" required error={section.errorFor(`${key}.phone`)} {...register(`${key}.phone`)} />
        </fieldset>
      ))}
    </SectionCard>
  );
}

function EmergencyContactSection({ employee }: { employee: EmployeeDetail }) {
  const ec = employee.emergencyContact;
  const section = useEmployeeSectionForm<EmergencyContactData>(employee.id, "emergencyContact", {
    name: ec.name ?? "",
    relationship: ec.relationship ?? "",
    primaryPhone: ec.primaryPhone ?? "",
    secondaryPhone: ec.secondaryPhone ?? "",
    sameAsHomeAddress: ec.sameAsHomeAddress ?? false,
    address: ec.address ?? "",
  });
  const { register, watch } = section.form;
  const sameAsHome = watch("sameAsHomeAddress");
  return (
    <SectionCard title="Emergency contact" section={section}>
      <NocturneTextField id="ec-name" label="Name" required error={section.errorFor("name")} {...register("name")} />
      <NocturneTextField id="ec-rel" label="Relationship" required error={section.errorFor("relationship")} {...register("relationship")} />
      <NocturneTextField id="ec-phone" label="Phone" type="tel" required error={section.errorFor("primaryPhone")} {...register("primaryPhone")} />
      <NocturneTextField id="ec-phone2" label="Second phone" type="tel" error={section.errorFor("secondaryPhone")} {...register("secondaryPhone")} />
      <div className={cn(full, "mb-4")}>
        <NocturneCheckbox id="ec-same" label="Lives at the employee's home address" {...register("sameAsHomeAddress")} />
      </div>
      {!sameAsHome && (
        <div className={full}>
          <NocturneTextareaField id="ec-address" label="Address" rows={3} required error={section.errorFor("address")} {...register("address")} />
        </div>
      )}
    </SectionCard>
  );
}

function HealthInsuranceSection({ employee }: { employee: EmployeeDetail }) {
  const hi = employee.healthInsurance;
  const section = useEmployeeSectionForm<HealthInsuranceData>(employee.id, "healthInsurance", {
    coverageType: hi.coverageType as HealthInsuranceData["coverageType"],
    dependents: hi.dependents ?? [],
    nomineeName: hi.nomineeName ?? "",
    nomineeRelationship: hi.nomineeRelationship ?? "",
  });
  const { register, control } = section.form;
  const dependents = useFieldArray({ control, name: "dependents" });
  return (
    <SectionCard title="Health insurance" section={section}>
      <NocturneSelectField id="hi-coverage" label="Coverage" required options={[...coverageTypeOptions]} error={section.errorFor("coverageType")} {...register("coverageType")} />
      <div className="hidden sm:block" />
      <NocturneTextField id="hi-nominee" label="Nominee name" required error={section.errorFor("nomineeName")} {...register("nomineeName")} />
      <NocturneTextField id="hi-nominee-rel" label="Nominee relationship" required error={section.errorFor("nomineeRelationship")} {...register("nomineeRelationship")} />
      <div className={cn(full, "flex flex-col gap-3")}>
        <p className={adminLabelClass}>Dependents ({dependents.fields.length}/5)</p>
        {dependents.fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 items-start gap-x-3 rounded-nocturne-control border border-nocturne-border px-3 pt-3 sm:grid-cols-[1fr_1fr_10rem_auto]">
            <NocturneTextField id={`dep-${index}-name`} label="Name" required error={section.errorFor(`dependents.${index}.name`)} {...register(`dependents.${index}.name`)} />
            <NocturneTextField id={`dep-${index}-rel`} label="Relationship" required error={section.errorFor(`dependents.${index}.relationship`)} {...register(`dependents.${index}.relationship`)} />
            <NocturneTextField id={`dep-${index}-dob`} label="Date of birth" type="date" required className="nocturne-mono" error={section.errorFor(`dependents.${index}.dateOfBirth`)} {...register(`dependents.${index}.dateOfBirth`)} />
            <button
              type="button"
              onClick={() => dependents.remove(index)}
              aria-label={`Remove dependent ${index + 1}`}
              className="mb-4 inline-flex size-11 items-center justify-center self-end rounded-nocturne-control text-nocturne-ink-muted hover:bg-nocturne-raised hover:text-nocturne-error focus-visible:outline-2 focus-visible:outline-nocturne-accent"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        {dependents.fields.length < 5 && (
          <NocturneButton type="button" size="sm" variant="secondary" className="self-start" onClick={() => dependents.append({ name: "", relationship: "", dateOfBirth: "" })}>
            <Plus className="size-4" aria-hidden />
            Add dependent
          </NocturneButton>
        )}
      </div>
    </SectionCard>
  );
}

/** HR edit page for a new hire's or employee's record, one section at a time. */
export function AdminEmployeeEditNocturne({ employee }: { employee: EmployeeDetail }) {
  const group = employee.status === "submitted" ? "employees" : "onboarding";
  const recordHref = `/admin/${group}/${employee.id}`;
  return (
    <div>
      <Link href={recordHref} className={backLinkClass}>
        <ArrowLeft className="size-4" aria-hidden />
        Back to {employee.name}
      </Link>
      <AdminPageHeading
        eyebrow={group === "employees" ? "People · Edit employee" : "People · Edit new hire"}
        title={`Edit ${employee.name}`}
        lead="Each section saves on its own. Every change is recorded in the audit log."
      />
      {group === "onboarding" && (
        <p className="mt-5 flex items-start gap-2.5 rounded-nocturne-control border border-nocturne-gold/40 bg-nocturne-gold-tint px-4 py-3 text-sm text-nocturne-ink">
          <Info className="mt-0.5 size-4 shrink-0 text-nocturne-gold" aria-hidden />
          {employee.name} is still filling in their onboarding. If they change the same section later, their answers replace yours.
        </p>
      )}
      <div className="mt-6 flex max-w-4xl flex-col gap-4">
        <PersonalSection employee={employee} />
        <GovernmentIdsSection employee={employee} />
        <ReferencesSection employee={employee} />
        <EmergencyContactSection employee={employee} />
        <HealthInsuranceSection employee={employee} />
      </div>
    </div>
  );
}
