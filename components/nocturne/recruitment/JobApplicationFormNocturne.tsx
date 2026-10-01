"use client";

import type { ReactNode } from "react";
import { FileText, Paperclip } from "lucide-react";
import { useJobApplicationFormLogic } from "@/hooks/recruitment/useJobApplicationFormLogic";
import { EDUCATION_OPTIONS } from "@/lib/recruitment/constants";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import {
  BackLink,
  CareersBand,
  JobSummaryCard,
  careersContainer,
  formatSalary,
  panelClass,
  softPanelClass,
} from "@/components/nocturne/recruitment/careersUi";
import { NocturneTextField } from "@/components/nocturne/ui/NocturneTextField";
import { NocturneTextareaField } from "@/components/nocturne/ui/NocturneTextareaField";
import { NocturneSelectField } from "@/components/nocturne/ui/NocturneSelectField";
import { NocturneButton, nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/utils/formatBytes";
import type { PublicJobDetail } from "@/types/recruitment";

/** Numbered form section: forest number badge + serif heading. */
function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const headingId = `apply-section-${step}`;
  return (
    <section aria-labelledby={headingId} className="mt-9 first:mt-0">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-nocturne-forest text-xs font-bold text-white ring-1 ring-nocturne-accent/40 ring-inset"
        >
          {step}
        </span>
        <h2 id={headingId} className="font-nocturne-display text-xl leading-tight font-semibold text-nocturne-ink">
          {title}
        </h2>
      </div>
      <p className="mt-1.5 text-[0.8125rem] text-nocturne-ink-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Dashed drop-zone style row around a file input; the "button" is the shared secondary look. */
const uploadRowClass =
  "flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 rounded-nocturne-control border border-dashed border-nocturne-border-strong/70 bg-nocturne-bg/60 px-4 py-3 transition-colors hover:border-nocturne-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-nocturne-accent";
const uploadButtonClass = `${nocturneButtonVariants({ variant: "secondary", size: "sm" })} ml-auto pointer-events-none`;

/** "What happens next": taken from what the confirmation page tells applicants. */
const NEXT_STEPS = [
  "You get an application reference as soon as you submit.",
  "Our recruitment team reviews your application.",
  "We contact you if there are further steps.",
];

export function JobApplicationFormNocturne({ job }: { job: PublicJobDetail }) {
  const {
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
  } = useJobApplicationFormLogic(job.id);

  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <NocturneCareersFrame>
      <CareersBand>
        <BackLink href={`/jobs/${job.id}`}>Back to {job.title}</BackLink>
        <h1 className="mt-2 font-nocturne-display text-[clamp(1.75rem,1.4rem+1.5vw,2.375rem)] leading-tight font-semibold tracking-[-0.015em] text-balance text-nocturne-ink">
          Apply for {job.title}
        </h1>
        <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">
          Tell us a bit about yourself — it only takes a few minutes. Fields marked{" "}
          <span className="text-nocturne-accent-text">*</span> are required.
        </p>
      </CareersBand>

      <main className={`${careersContainer} pt-5 pb-16 sm:pt-6 sm:pb-24`}>
        <div className="grid grid-cols-1 gap-5 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start">
          <form
            onSubmit={onContinue}
            className={cn(panelClass, "min-w-0 p-5 sm:px-6 sm:py-6")}
          >
            <div className="flex flex-col">
              <FormSection step={1} title="Your details" description="How we can reach you, and a little about your background.">
                <div className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
                  <NocturneTextField label="First name" required autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
                  <NocturneTextField label="Last name" required autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
                  <NocturneTextField label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register("email")} />
                  <NocturneTextField label="Phone number" type="tel" required autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
                  <NocturneTextField label="Current location" required error={errors.location?.message} {...register("location")} />
                  <NocturneTextField
                    label="Years of experience"
                    type="number"
                    min={0}
                    required
                    error={errors.experienceYears?.message}
                    {...register("experienceYears")}
                  />
                  <div className="sm:col-span-2">
                    <NocturneSelectField
                      label="Highest education"
                      required
                      options={[...EDUCATION_OPTIONS]}
                      error={errors.education?.message}
                      {...register("education")}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection step={2} title="Resume & links" description="PDF or Word for your resume. Everything else is optional.">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[0.8125rem] font-medium text-nocturne-ink-muted">
                      Resume <span className="text-nocturne-accent-text">*</span>
                    </p>
                    <label className={cn(uploadRowClass, "mt-1.5", resumeError && "border-nocturne-error")}>
                      <FileText className="size-5 shrink-0 text-nocturne-ink-muted" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-nocturne-ink">
                          {resumeFile ? resumeFile.name : "Upload your resume"}
                        </span>
                        <span className="block text-xs text-nocturne-ink-muted">
                          {resumeFile ? formatBytes(resumeFile.size) : "PDF or Word"}
                        </span>
                      </span>
                      <span className={uploadButtonClass}>{resumeFile ? "Replace file" : "Browse"}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="sr-only"
                        onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="mt-1.5 min-h-4.25 text-[0.8125rem] text-nocturne-error" role={resumeError ? "alert" : undefined}>
                      {resumeError || " "}
                    </p>
                  </div>

                  <NocturneTextareaField label="Cover letter" rows={5} helperText="Optional" error={errors.coverLetter?.message} {...register("coverLetter")} />
                  <div className="grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
                    <NocturneTextField
                      label="LinkedIn profile"
                      type="url"
                      placeholder="https://linkedin.com/in/you"
                      helperText="Optional"
                      error={errors.linkedinUrl?.message}
                      {...register("linkedinUrl")}
                    />
                    <NocturneTextField
                      label="Portfolio / Website"
                      type="url"
                      placeholder="https://…"
                      helperText="Optional"
                      error={errors.portfolioUrl?.message}
                      {...register("portfolioUrl")}
                    />
                  </div>

                  <label className={uploadRowClass}>
                    <Paperclip className="size-5 shrink-0 text-nocturne-ink-muted" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-nocturne-ink">
                        {otherFile ? otherFile.name : "Attach additional document (optional)"}
                      </span>
                      {otherFile && <span className="block text-xs text-nocturne-ink-muted">{formatBytes(otherFile.size)}</span>}
                    </span>
                    <span className={uploadButtonClass}>{otherFile ? "Replace file" : "Browse"}</span>
                    <input type="file" className="sr-only" onChange={(e) => setOtherFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              </FormSection>

              <div className="mt-7 flex flex-col gap-4 border-t border-nocturne-border pt-6">
                {submitError && (
                  <p className="nocturne-type-meta rounded-nocturne-control bg-nocturne-error-tint px-4 py-3 text-nocturne-error" role="alert">
                    {submitError}
                  </p>
                )}
                <NocturneButton type="submit" isLoading={isSubmitting} className="w-full sm:w-auto sm:self-start">
                  Submit application
                </NocturneButton>
              </div>
            </div>
          </form>

          <aside className="flex flex-col gap-3.5 tablet:sticky tablet:top-6">
            <JobSummaryCard eyebrow={"You’re applying for"} job={job} salary={salary} />
            <div className={cn(softPanelClass, "px-5 py-5 sm:px-6")}>
              <h2 className="font-nocturne-display text-[1.1875rem] leading-tight font-semibold text-nocturne-ink">
                What happens next
              </h2>
              <ol className="mt-3 flex flex-col gap-2.5">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="flex items-start gap-2.5 text-sm text-nocturne-ink">
                    <span
                      aria-hidden
                      className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-nocturne-card nocturne-mono text-[0.6875rem] font-semibold text-nocturne-ink-muted"
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </main>
    </NocturneCareersFrame>
  );
}
