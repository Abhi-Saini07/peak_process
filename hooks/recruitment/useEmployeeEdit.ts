"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type DefaultValues, type FieldErrors, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EMPLOYEE_EDIT_SCHEMAS, type EmployeeEditSection } from "@/lib/onboarding/employeeEdit";
import { requestJson } from "@/lib/utils/requestJson";

/**
 * One section of the HR edit page: its own form, validated with the same
 * schema as the API, saved on its own so a problem in one section never
 * blocks the others.
 */
export function useEmployeeSectionForm<T extends FieldValues>(employeeId: string, section: EmployeeEditSection, defaults: T) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const form = useForm<T>({
    resolver: zodResolver(EMPLOYEE_EDIT_SCHEMAS[section] as never) as unknown as Resolver<T>,
    defaultValues: defaults as DefaultValues<T>,
  });

  const submit = form.handleSubmit(async (data) => {
    setServerError(null);
    setJustSaved(false);
    const result = await requestJson(`/api/admin/employees/${employeeId}`, "PATCH", { section, data });
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setJustSaved(true);
    // Government IDs are write-only: clear the inputs after saving.
    form.reset(section === "governmentIds" ? defaults : data);
    router.refresh();
  });

  return {
    form,
    submit,
    serverError,
    saved: justSaved && !form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
    /** The message for a nested field path like "basicInfo.firstName". */
    errorFor: (path: string) => fieldError(form.formState.errors, path),
  };
}
export type EmployeeSectionForm<T extends FieldValues> = ReturnType<typeof useEmployeeSectionForm<T>>;

function fieldError(errors: FieldErrors, path: string): string | undefined {
  let node: unknown = errors;
  for (const key of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[key];
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
}
