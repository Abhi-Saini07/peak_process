"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormDefaults, jobSchema, type JobFormInput } from "@/lib/schemas/job.schema";
import type { JobDetail } from "@/types/recruitment";

type SkillField = "requiredSkills" | "preferredSkills";

interface UseJobFormLogicOptions {
  mode: "create" | "edit";
  jobId?: string;
  initialJob?: JobDetail;
}

function toFormData(job?: JobDetail): JobFormInput {
  if (!job) return jobFormDefaults;
  return {
    title: job.title,
    department: job.department ?? "",
    location: job.location ?? "",
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceMinYears: job.experienceMinYears ?? undefined,
    experienceMaxYears: job.experienceMaxYears ?? undefined,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    salaryPublic: job.salaryPublic,
    overview: job.overview ?? "",
    responsibilities: job.responsibilities ?? "",
    requirements: job.requirements ?? "",
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    education: job.education ?? "",
    benefits: job.benefits ?? "",
    deadline: job.deadline ?? "",
    status: job.status,
  };
}

/** Shared logic for both the "create job" and "edit job" forms (same fields,
 *  same schema) — mirrors the onboarding hooks/steps/* pattern of extracting
 *  all form wiring into one presentation-agnostic hook. */
export function useJobFormLogic({ mode, jobId, initialJob }: UseJobFormLogicOptions) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobFormInput>({ resolver: zodResolver(jobSchema), defaultValues: toFormData(initialJob) });

  const requiredSkills = watch("requiredSkills") ?? [];
  const preferredSkills = watch("preferredSkills") ?? [];

  function addSkill(field: SkillField, skill: string) {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const current = field === "requiredSkills" ? requiredSkills : preferredSkills;
    if (current.includes(trimmed)) return;
    setValue(field, [...current, trimmed], { shouldValidate: true, shouldDirty: true });
  }

  function removeSkill(field: SkillField, index: number) {
    const current = field === "requiredSkills" ? requiredSkills : preferredSkills;
    setValue(
      field,
      current.filter((_, i) => i !== index),
      { shouldValidate: true, shouldDirty: true },
    );
  }

  const onContinue = handleSubmit(async (data) => {
    setSubmitError(null);
    const url = mode === "create" ? "/api/admin/jobs" : `/api/admin/jobs/${jobId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error ?? "Couldn't save this job. Please try again.");
      return;
    }

    const body = (await res.json()) as { id: string };
    router.push(`/admin/jobs/${mode === "create" ? body.id : jobId}`);
    router.refresh();
  });

  return {
    register,
    errors,
    isSubmitting,
    submitError,
    onContinue,
    requiredSkills,
    preferredSkills,
    addSkill,
    removeSkill,
  };
}
