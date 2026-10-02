"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  pageTitleClass,
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

/** The single-page form reads as three parts; the mini step indicator
 *  under the title jumps to each and marks the one in view. */
const SECTIONS = [
  { step: 1, label: "Your details" },
  { step: 2, label: "Resume & links" },
  { step: 3, label: "Review" },
] as const;

const sectionId = (step: number) => `apply-section-${step}`;

/** Which form part is in view (top third of the viewport), for the step indicator. */
function useSectionInView() {
  const [current, setCurrent] = useState(1);
  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(sectionId(s.step))).filter(
      (n): n is HTMLElement => Boolean(n),
    );
    if (nodes.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const step = Number((entry.target as HTMLElement).dataset.step);
          if (entry.isIntersecting) visible.add(step);
          else visible.delete(step);
        }
        if (visible.size > 0) setCurrent(Math.min(...visible));
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);
  return current;
}

/** "1 Your details · 2 Resume & links · 3 Review" pills linking to the form parts. */
function MiniSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Application sections" className="mt-5">
      <ol className="flex flex-wrap gap-1.5 sm:gap-2">
        {SECTIONS.map((s) => {
          const on = s.step === current;
          return (
            <li key={s.step}>
              <a
                href={`#${sectionId(s.step)}`}
                aria-current={on ? "step" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-nocturne-pill bg-nocturne-card pr-2.5 pl-1.5 text-xs font-medium whitespace-nowrap sm:h-8.5 sm:gap-2 sm:pr-3.5 sm:text-[0.8125rem] shadow-nocturne-rest ring-1 transition-[color,box-shadow] duration-200 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent motion-reduce:transition-none",
                  on
                    ? "text-nocturne-ink ring-nocturne-accent/55"
                    : "text-nocturne-ink-muted ring-nocturne-border hover:text-nocturne-ink hover:ring-nocturne-border-strong",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "nocturne-mono flex size-5.5 items-center justify-center rounded-full text-[0.6875rem] font-bold transition-colors duration-200 motion-reduce:transition-none",
                    on ? "bg-nocturne-accent text-nocturne-on-accent" : "bg-nocturne-raised text-nocturne-ink-muted",
                  )}
                >
                  {s.step}
                </span>
                {s.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Numbered form section: raised number badge + Sora heading. */
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
  const headingId = `${sectionId(step)}-title`;
  return (
    <section
      id={sectionId(step)}
      data-step={step}
      aria-labelledby={headingId}
      className="mt-6 scroll-mt-6 border-t border-nocturne-border pt-6 first:mt-0 first:border-t-0 first:pt-0"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="nocturne-mono flex size-7 shrink-0 items-center justify-center rounded-full bg-nocturne-accent-tint text-xs font-bold text-nocturne-accent-text"
        >
          {step}
        </span>
        <h2
          id={headingId}
          className="font-nocturne-display text-[1.1875rem] leading-tight font-semibold tracking-[-0.015em] text-nocturne-ink"
        >
          {title}
        </h2>
      </div>
      <p className="mt-1.5 text-[0.8125rem] text-nocturne-ink-muted sm:pl-9.5">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Dashed drop-zone style row around a file input; the "button" is the shared secondary look. */
const uploadRowClass =
  "flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-2 rounded-nocturne-control border border-dashed border-nocturne-border-strong px-4 py-3.5 transition-[border-color,background-color] duration-150 hover:border-nocturne-accent hover:bg-nocturne-accent-tint/40 focus-within:border-nocturne-accent focus-within:shadow-nocturne-glow";
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
  } = useJobApplicationFormLogic(job.id, job.knockouts);

  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const currentSection = useSectionInView();

  return (
    <NocturneCareersFrame>
      <CareersBand>
        <BackLink href={`/jobs/${job.id}`}>Back to {job.title}</BackLink>
        <p className="nocturne-type-eyebrow mt-6 text-nocturne-accent-text">
          Application{job.department ? ` · ${job.department}` : ""}
        </p>
        <h1 className={cn(pageTitleClass, "mt-3 text-[clamp(1.875rem,1.4rem+1.9vw,2.625rem)]")}>
          <span className="sr-only">Apply for </span>
          {job.title}
        </h1>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">
          Tell us a bit about yourself — it only takes a few minutes. Fields marked{" "}
          <span className="text-nocturne-accent-text">*</span> are required.
        </p>
        <MiniSteps current={currentSection} />
      </CareersBand>

      <main className={`${careersContainer} pt-5 pb-16 sm:pb-24`}>
        <div className="grid grid-cols-1 gap-5 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start tablet:gap-6">
          <form onSubmit={onContinue} className={cn(panelClass, "min-w-0 p-5 sm:px-6.5 sm:py-6.5")}>
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
                {job.knockouts.length > 0 && (
                  <div className="mt-4 flex flex-col gap-4 rounded-nocturne-control border border-nocturne-border bg-nocturne-surface p-4 sm:p-5">
                    {job.knockouts.map((q) => {
                      const error = errors.knockoutAnswers?.[q.id]?.message;
                      const groupId = `knockout-${q.id}`;
                      return (
                        <fieldset key={q.id} aria-describedby={error ? `${groupId}-error` : undefined}>
                          <legend className="text-sm leading-snug font-semibold text-nocturne-ink">
                            {q.label} <span className="text-nocturne-accent-text">*</span>
                          </legend>
                          <div className="mt-2.5 flex gap-2">
                            {(["yes", "no"] as const).map((value) => (
                              <label key={value} className="relative cursor-pointer">
                                <input
                                  type="radio"
                                  value={value}
                                  className="peer sr-only"
                                  aria-invalid={Boolean(error) || undefined}
                                  {...register(`knockoutAnswers.${q.id}`)}
                                />
                                <span
                                  className={cn(
                                    "inline-flex h-10 min-w-20 items-center justify-center rounded-nocturne-control border bg-nocturne-card px-5 text-sm font-semibold text-nocturne-ink-muted transition-[color,border-color,background-color,box-shadow] peer-checked:border-nocturne-accent peer-checked:bg-nocturne-accent-tint peer-checked:text-nocturne-ink peer-hover:text-nocturne-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-nocturne-accent motion-reduce:transition-none in-data-[theme=dark]:bg-nocturne-bg",
                                    error ? "border-nocturne-error" : "border-nocturne-border-strong",
                                  )}
                                >
                                  {value === "yes" ? "Yes" : "No"}
                                </span>
                              </label>
                            ))}
                          </div>
                          {error && (
                            <p id={`${groupId}-error`} className="mt-1.5 text-[0.8125rem] text-nocturne-error" role="alert">
                              {error}
                            </p>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                )}
              </FormSection>

              <FormSection step={2} title="Resume & links" description="PDF or Word for your resume. Everything else is optional.">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[0.8125rem] font-semibold text-nocturne-ink">
                      Resume <span className="text-nocturne-accent-text">*</span>
                    </p>
                    <label className={cn(uploadRowClass, "mt-1.5", resumeError && "border-nocturne-error hover:border-nocturne-error")}>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-nocturne-control bg-nocturne-raised"><FileText className="size-4.5 text-nocturne-ink-muted" aria-hidden /></span>
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
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-nocturne-control bg-nocturne-raised"><Paperclip className="size-4.5 text-nocturne-ink-muted" aria-hidden /></span>
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

              <FormSection step={3} title="Review" description="Check your details above, then send your application.">
                <div className="flex flex-col gap-4">
                  {submitError && (
                    <p className="nocturne-type-meta rounded-nocturne-control bg-nocturne-error-tint px-4 py-3 text-nocturne-error" role="alert">
                      {submitError}
                    </p>
                  )}
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[0.8125rem] text-nocturne-ink-muted">
                      You{"’"}ll get an application reference straight away.
                    </p>
                    <NocturneButton type="submit" isLoading={isSubmitting} showArrow className="w-full sm:w-auto">
                      Submit application
                    </NocturneButton>
                  </div>
                </div>
              </FormSection>
            </div>
          </form>

          <aside className="flex flex-col gap-3.5 tablet:sticky tablet:top-6">
            <JobSummaryCard eyebrow={"You’re applying for"} job={job} salary={salary} />
            <div className={cn(softPanelClass, "px-5 py-5 sm:px-6")}>
              <h2 className="font-nocturne-display text-[1.0625rem] leading-tight font-semibold tracking-[-0.01em] text-nocturne-ink">
                What happens next
              </h2>
              <ol className="mt-3.5 flex flex-col gap-3">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm leading-snug text-nocturne-ink">
                    <span
                      aria-hidden
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-nocturne-card nocturne-mono text-[0.6875rem] font-bold text-nocturne-accent-text shadow-nocturne-rest"
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
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
