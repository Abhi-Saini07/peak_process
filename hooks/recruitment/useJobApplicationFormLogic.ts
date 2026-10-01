"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobApplicationDefaults, jobApplicationSchema, type JobApplicationFormInput } from "@/lib/schemas/application.schema";
import { getDraft, useJobApplicationDraftStore } from "@/lib/store/jobApplicationDraftStore";

export function useJobApplicationFormLogic(jobId: string) {
  const router = useRouter();
  const draft = getDraft(jobId);
  const updateValues = useJobApplicationDraftStore((s) => s.updateValues);
  const setResumeFileInStore = useJobApplicationDraftStore((s) => s.setResumeFile);
  const setOtherFileInStore = useJobApplicationDraftStore((s) => s.setOtherFile);
  const clearDraft = useJobApplicationDraftStore((s) => s.clearDraft);

  const [resumeFile, setResumeFileState] = useState<File | null>(draft.resumeFile);
  const [otherFile, setOtherFileState] = useState<File | null>(draft.otherFile);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationFormInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: { ...jobApplicationDefaults, ...draft.values },
  });

  // Mirrors onboarding's useOnboardingForm watch()-to-store bridge: pushes
  // in-progress values into the shared draft store so switching designs
  // (which unmounts this hook and mounts a fresh one) doesn't lose them.
  useEffect(() => {
    const subscription = watch((values) => {
      updateValues(jobId, values as Partial<JobApplicationFormInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, jobId, updateValues]);

  function setResumeFile(file: File | null) {
    setResumeFileState(file);
    setResumeFileInStore(jobId, file);
  }

  function setOtherFile(file: File | null) {
    setOtherFileState(file);
    setOtherFileInStore(jobId, file);
  }

  const onContinue = handleSubmit(async (data) => {
    setSubmitError(null);
    if (!resumeFile) {
      setResumeError("Please attach your resume.");
      return;
    }
    setResumeError(null);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });
    formData.set("resume", resumeFile);
    if (otherFile) formData.set("other", otherFile);

    const res = await fetch(`/api/jobs/${jobId}/apply`, { method: "POST", body: formData });

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
    onContinue,
  };
}
