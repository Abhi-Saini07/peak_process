/**
 * Single source of truth for every job/application enum's option list —
 * consumed by zod schemas (lib/schemas/job.schema.ts, application.schema.ts)
 * and every <select>/chip UI across all three designs. Mirrors how
 * lib/schemas/shared.ts's genderOptions already works for onboarding.
 */

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;

export const WORK_MODE_OPTIONS = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
] as const;

export const JOB_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "closed", label: "Closed" },
] as const;

export const APPLICATION_STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
] as const;

export const EDUCATION_OPTIONS = [
  { value: "high_school", label: "High School" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "other", label: "Other" },
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPE_OPTIONS)[number]["value"];
export type WorkMode = (typeof WORK_MODE_OPTIONS)[number]["value"];
export type JobStatus = (typeof JOB_STATUS_OPTIONS)[number]["value"];
export type ApplicationStatus = (typeof APPLICATION_STATUS_OPTIONS)[number]["value"];
export type EducationLevel = (typeof EDUCATION_OPTIONS)[number]["value"];

function labelFrom<T extends { value: string; label: string }>(options: readonly T[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export const employmentTypeLabel = (value: string) => labelFrom(EMPLOYMENT_TYPE_OPTIONS, value);
export const workModeLabel = (value: string) => labelFrom(WORK_MODE_OPTIONS, value);
export const jobStatusLabel = (value: string) => labelFrom(JOB_STATUS_OPTIONS, value);
export const applicationStatusLabel = (value: string) => labelFrom(APPLICATION_STATUS_OPTIONS, value);
export const educationLabel = (value: string) => labelFrom(EDUCATION_OPTIONS, value);

/** Statuses that represent the applicant being out of consideration/finished — used to gray out further status actions. */
export const TERMINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = ["selected", "rejected"];
