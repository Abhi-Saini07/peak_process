"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  jobApplicationDefaults,
  jobApplicationSchemaFor,
  type JobApplicationWithKnockoutsData,
  type JobApplicationWithKnockoutsInput,
} from "@/lib/schemas/application.schema";
import type { PublicKnockoutQuestion } from "@/lib/recruitment/knockouts";
import { HONEYPOT_FIELD } from "@/lib/schemas/application.schema";
import { MAGIC_BYTES_NEEDED, validateDocument } from "@/lib/recruitment/uploads";

async function checkDocument(file: File, what: string): Promise<string | null> {
  try {
    const head = new Uint8Array(await file.slice(0, MAGIC_BYTES_NEEDED).arrayBuffer());
    const result = validateDocument({ name: file.name, type: file.type, size: file.size }, head, what);
    return result.ok ? null : result.error;
  } catch {
    return `${what} couldn't be read. Choose the file again.`;
  }
}
import { getDraft, useJobApplicationDraftStore } from "@/lib/store/jobApplicationDraftStore";

export function useJobApplicationFormLogic(jobId: string, knockouts: readonly PublicKnockoutQuestion[] = []) {
  const router = useRouter();
  const draft = getDraft(jobId);
  const updateValues = useJobApplicationDraftStore((s) => s.updateValues);
  const setResumeFileInStore = useJobApplicationDraftStore((s) => s.setResumeFile);
  const setOtherFileInStore = useJobApplicationDraftStore((s) => s.setOtherFile);
  const clearDraft = useJobApplicationDraftStore((s) => s.clearDraft);

  const [resumeFile, setResumeFileState] = useState<File | null>(draft.resumeFile);
  const [otherFile, setOtherFileState] = useState<File | null>(draft.otherFile);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [otherError, setOtherError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const schema = useMemo(() => jobApplicationSchemaFor(knockouts), [knockouts]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationWithKnockoutsInput, unknown, JobApplicationWithKnockoutsData>({
    resolver: zodResolver(schema),
    defaultValues: { ...jobApplicationDefaults, knockoutAnswers: {}, consent: false, ...draft.values },
  });

  // Mirrors onboarding's useOnboardingForm watch()-to-store bridge: pushes
  // in-progress values into the shared draft store so switching designs
  // (which unmounts this hook and mounts a fresh one) doesn't lose them.
  useEffect(() => {
    const subscription = watch((values) => {
      updateValues(jobId, values as Partial<JobApplicationWithKnockoutsInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, jobId, updateValues]);

  // Same checks as the API (type, size, first bytes), so a bad file is caught on pick.
  async function setResumeFile(file: File | null) {
    const error = file ? await checkDocument(file, "Your resume") : null;
    setResumeError(error);
    const accepted = error ? null : file;
    setResumeFileState(accepted);
    setResumeFileInStore(jobId, accepted);
  }

  async function setOtherFile(file: File | null) {
    const error = file ? await checkDocument(file, "The additional document") : null;
    setOtherError(error);
    const accepted = error ? null : file;
    setOtherFileState(accepted);
    setOtherFileInStore(jobId, accepted);
  }

  const onContinue = handleSubmit(async (data, event) => {
    setSubmitError(null);
    if (!resumeFile) {
      setResumeError("Please attach your resume.");
      return;
    }
    const fileError = await checkDocument(resumeFile, "Your resume");
    if (fileError) {
      setResumeError(fileError);
      return;
    }
    setResumeError(null);

    const formData = new FormData();
    // The honeypot isn't a form field in react-hook-form; read it off the form element.
    const form = event?.target instanceof HTMLFormElement ? event.target : null;
    const honeypot = form ? new FormData(form).get(HONEYPOT_FIELD) : null;
    if (typeof honeypot === "string" && honeypot) formData.set(HONEYPOT_FIELD, honeypot);
    const { knockoutAnswers, ...fields } = data;
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    formData.set("knockoutAnswers", JSON.stringify(knockoutAnswers ?? {}));
    formData.set("resume", resumeFile);
    if (otherFile) formData.set("other", otherFile);

    let res: Response;
    try {
      res = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST", body: formData });
    } catch {
      setSubmitError("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error ?? "Couldn't submit your application. Please try again.");
      return;
    }

    const body = (await res.json()) as { reference: string };
    clearDraft(jobId);
    router.push(`/jobs/${jobId}/applied?ref=${encodeURIComponent(body.reference)}`);
  });

  return {
    register,
    errors,
    isSubmitting,
    submitError,
    resumeFile,
    setResumeFile,
    resumeError,
    otherFile,
    setOtherFile,
    otherError,
    onContinue,
  };
}
