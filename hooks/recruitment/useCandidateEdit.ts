"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  candidateDetailsSchema,
  type CandidateDetailsFormInput,
  type CandidateDetailsInput,
} from "@/lib/schemas/application.schema";
import { requestJson } from "@/lib/utils/requestJson";
import type { ApplicationDetail } from "@/types/recruitment";

function defaultsFrom(a: ApplicationDetail): CandidateDetailsFormInput {
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    phone: a.phone ?? "",
    location: a.location ?? "",
    experienceYears: a.experienceYears ?? "",
    education: (a.education ?? "") as CandidateDetailsFormInput["education"],
    linkedinUrl: a.linkedinUrl ?? "",
    portfolioUrl: a.portfolioUrl ?? "",
  };
}

/** "Edit candidate" dialog: same rules as the API, saved with one PATCH. */
export function useCandidateEdit(application: ApplicationDetail) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<CandidateDetailsFormInput, unknown, CandidateDetailsInput>({
    resolver: zodResolver(candidateDetailsSchema),
    defaultValues: defaultsFrom(application),
  });

  const submit = form.handleSubmit(async (data) => {
    setServerError(null);
    const result = await requestJson(`/api/admin/applications/${application.id}/candidate`, "PATCH", data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setIsOpen(false);
    router.refresh();
  });

  return {
    isOpen,
    open: () => {
      form.reset(defaultsFrom(application));
      setServerError(null);
      setIsOpen(true);
    },
    close: () => !form.formState.isSubmitting && setIsOpen(false),
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    submit,
  };
}
export type CandidateEdit = ReturnType<typeof useCandidateEdit>;
