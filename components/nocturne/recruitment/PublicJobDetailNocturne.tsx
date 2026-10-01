import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import {
  BackLink,
  JobFacts,
  JobMetaRow,
  NAV_FORWARD,
  careersContainer,
  formatSalary,
  glowPanelClass,
  heroGlowClass,
  pageTitleClass,
  panelClass,
  panelHeadingClass,
  teamPillClass,
} from "@/components/nocturne/recruitment/careersUi";
import { nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { cn } from "@/lib/utils/cn";
import type { PublicJobDetail } from "@/types/recruitment";

const proseText = "text-[0.9375rem] leading-relaxed text-nocturne-ink-muted";

/** One block of the role description; blocks are split by hairlines. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 border-t border-nocturne-border pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <h2 className={panelHeadingClass}>{title}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function BulletList({ text }: { text: string }) {
  const items = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className={cn(proseText, "flex gap-3")}>
          <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-nocturne-accent" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function hasItems(text: string | null): text is string {
  return Boolean(text && text.split("\n").some((l) => l.trim()));
}

function SkillList({ label, skills, emphasis }: { label: string; skills: string[]; emphasis: boolean }) {
  return (
    <div>
      <p className="text-[0.8125rem] font-semibold text-nocturne-ink">{label}</p>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {skills.map((s) => (
          <li
            key={s}
            className={
              emphasis
                ? teamPillClass
                : "inline-flex items-center rounded-nocturne-pill bg-nocturne-raised px-2.5 py-1 text-xs leading-none font-semibold text-nocturne-ink"
            }
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicJobDetailNocturne({ job }: { job: PublicJobDetail }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const hasSkills = job.requiredSkills.length > 0 || job.preferredSkills.length > 0;
  const hasProse =
    Boolean(job.overview) ||
    hasItems(job.responsibilities) ||
    hasItems(job.requirements) ||
    hasSkills ||
    Boolean(job.education) ||
    hasItems(job.benefits);

  return (
    <NocturneCareersFrame>
      <main className={heroGlowClass}>
        <div
          className={`${careersContainer} grid grid-cols-1 gap-7 pt-6 pb-16 sm:pt-9 sm:pb-24 tablet:grid-cols-[minmax(0,1fr)_21.25rem] tablet:items-start tablet:gap-8`}
        >
          <div className="min-w-0">
            <BackLink href="/jobs">All positions</BackLink>
            {job.department && <p className="nocturne-type-eyebrow mt-6 text-nocturne-accent-text">{job.department}</p>}
            <h1 className={cn(pageTitleClass, job.department ? "mt-3" : "mt-6")}>{job.title}</h1>
            <JobMetaRow job={job} salary={salary} className="mt-5" />

            <Link
              href={`/jobs/${job.id}/apply`}
              transitionTypes={NAV_FORWARD}
              className={`${nocturneButtonVariants({ variant: "primary" })} mt-6 w-full tablet:hidden`}
            >
              Apply now
              <ArrowRight className="size-4" aria-hidden />
            </Link>

            {hasProse && (
              <div className={cn(panelClass, "mt-7 px-5 py-6 sm:px-7 sm:py-7")}>
                {job.overview && (
                  <Section title="Overview">
                    <p className={cn(proseText, "whitespace-pre-line")}>{job.overview}</p>
                  </Section>
                )}
                {hasItems(job.responsibilities) && (
                  <Section title="Responsibilities">
                    <BulletList text={job.responsibilities} />
                  </Section>
                )}
                {hasItems(job.requirements) && (
                  <Section title="Requirements">
                    <BulletList text={job.requirements} />
                  </Section>
                )}
                {hasSkills && (
                  <Section title="Skills">
                    <div className="mt-1 flex flex-col gap-4">
                      {job.requiredSkills.length > 0 && (
                        <SkillList label="Required" skills={job.requiredSkills} emphasis />
                      )}
                      {job.preferredSkills.length > 0 && (
                        <SkillList label="Preferred" skills={job.preferredSkills} emphasis={false} />
                      )}
                    </div>
                  </Section>
                )}
                {job.education && (
                  <Section title="Education">
                    <p className={proseText}>{job.education}</p>
                  </Section>
                )}
                {hasItems(job.benefits) && (
                  <Section title="Benefits">
                    <BulletList text={job.benefits} />
                  </Section>
                )}
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-3.5 tablet:sticky tablet:top-6" aria-label="Apply for this role">
            <div className={cn(glowPanelClass, "px-5 py-5.5 sm:px-6")}>
              <h2 className="font-nocturne-display text-[1.375rem] leading-tight font-semibold tracking-[-0.02em] text-nocturne-ink">
                Interested?
              </h2>
              <p className="mt-1.5 text-[0.8125rem] text-nocturne-ink-muted">Applying only takes a few minutes.</p>
              <Link
                href={`/jobs/${job.id}/apply`}
                transitionTypes={NAV_FORWARD}
                className={`${nocturneButtonVariants({ variant: "primary" })} mt-4 w-full`}
              >
                Apply now
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className={cn(panelClass, "px-5 py-5 sm:px-6")}>
              <h2 className="nocturne-type-eyebrow text-nocturne-ink-muted">Role details</h2>
              <JobFacts job={job} salary={salary} className="mt-4" />
            </div>
          </aside>
        </div>
      </main>
    </NocturneCareersFrame>
  );
}
