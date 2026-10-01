"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import {
  useCompletionPercent,
  useCurrentStepId,
  useFullName,
  useRequiredDocumentsRemaining,
  useStepStatuses,
} from "@/lib/store/selectors";
import { getStepById, getStepIndex, stepRegistry } from "@/lib/onboarding/steps.config";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";
import type { DocumentMeta, DocumentRequirement } from "@/types/onboarding";
import { nocturneButtonVariants } from "./ui/NocturneButton";
import { NocturneStepTimeline } from "./NocturneStepTimeline";
import {
  NocturneEyebrow,
  NocturnePill,
  NocturneProgressBar,
  nocturneCardClass,
  nocturneFocusCardClass,
  nocturneLeadClass,
  nocturnePageTitleClass,
} from "./NocturneStepShell";

const REQUIRED_DOCS = DOCUMENT_REQUIREMENTS.filter((doc) => doc.required);

function NocturneDashboardSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none">
      <div className="flex items-end justify-between gap-6">
        <div className="w-2/3">
          <div className="h-3 w-24 rounded bg-nocturne-skeleton" />
          <div className="mt-3 h-10 w-full max-w-md rounded bg-nocturne-skeleton" />
        </div>
        <div className="h-14 w-28 rounded bg-nocturne-skeleton" />
      </div>
      <div className="mt-6 h-2 rounded-nocturne-pill bg-nocturne-skeleton" />
      <div className="mt-4 grid grid-cols-7 gap-1">
        {stepRegistry.map((step) => (
          <div key={step.id} className="flex justify-center">
            <div className="size-7.5 rounded-full bg-nocturne-skeleton" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="h-60 rounded-nocturne-card bg-nocturne-skeleton" />
        <div className="h-60 rounded-nocturne-card bg-nocturne-skeleton" />
      </div>
    </div>
  );
}

/** Status word for one document, in the mockup's amber/mint vocabulary. */
function documentStatus(req: DocumentRequirement, meta: DocumentMeta | undefined): { label: string; tone: string } {
  const status = meta?.status ?? "pending";
  if (status === "provided") return { label: "Ready", tone: "text-nocturne-success" };
  if (status === "uploaded") return { label: "Uploaded", tone: "text-nocturne-success" };
  if (status === "uploading") return { label: "Uploading…", tone: "text-nocturne-accent-text" };
  if (status === "error") return { label: "Upload failed", tone: "text-nocturne-error" };
  if (req.providedByHR) return { label: "Pending from HR", tone: "text-nocturne-ink-muted" };
  return req.required
    ? { label: "Required", tone: "text-nocturne-gold" }
    : { label: "Optional", tone: "text-nocturne-ink-faint" };
}

function DocumentsPanel() {
  const documents = useOnboardingStore((s) => s.documents);
  const remainingDocs = useRequiredDocumentsRemaining();
  const received = REQUIRED_DOCS.length - remainingDocs;

  return (
    <section aria-labelledby="nocturne-dash-docs" className={cn(nocturneCardClass, "flex flex-col px-4.5 py-5 sm:px-6 sm:py-5.5")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="nocturne-dash-docs" className="text-base font-bold text-nocturne-ink">
          Documents
        </h2>
        <p className="text-xs text-nocturne-ink-muted">
          <span className="font-nocturne-mono font-semibold text-nocturne-ink">
            {received}/{REQUIRED_DOCS.length}
          </span>{" "}
          required received
        </p>
      </div>
      <ul className="mt-2">
        {DOCUMENT_REQUIREMENTS.map((req) => {
          const { label, tone } = documentStatus(req, documents[req.id]);
          return (
            <li
              key={req.id}
              className="flex items-center justify-between gap-3 border-b border-nocturne-border py-3 text-sm"
            >
              <span className="min-w-0 truncate text-nocturne-ink">{req.label}</span>
              <span className={cn("shrink-0 text-xs font-bold", tone)}>{label}</span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/onboarding/documents"
        className="mt-4 inline-flex items-center gap-1.5 self-start rounded-sm text-[0.8125rem] font-bold text-nocturne-accent-text underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
      >
        {remainingDocs > 0 ? "Upload documents" : "Manage documents"} <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </section>
  );
}

export function NocturneDashboard() {
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);
  const submitted = useOnboardingStore((s) => s.submitted);
  const submittedAt = useOnboardingStore((s) => s.submittedAt);
  const fullName = useFullName();
  const percent = useCompletionPercent();
  const statuses = useStepStatuses();
  const currentStepId = useCurrentStepId();
  const currentStep = getStepById(currentStepId);
  const firstName = fullName ? (fullName.trim().split(/\s+/)[0] ?? null) : null;
  const doneCount = stepRegistry.filter((step) => statuses[step.id] === "completed").length;
  const continueHref = fullName ? `/onboarding/${currentStep.slug}` : "/onboarding/welcome";
  // Steps still to do after the next one (real statuses, in order).
  const comingUp = stepRegistry.filter((step) => step.id !== currentStep.id && statuses[step.id] !== "completed");

  return (
    <div className="min-h-screen bg-nocturne-bg font-nocturne-sans text-nocturne-ink">
      <div className="mx-auto w-full max-w-[68rem] px-4 py-6 sm:px-8 sm:py-8 tablet:px-12 tablet:py-10">
        {!hasHydrated ? (
          <NocturneDashboardSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="min-w-0">
                <NocturneEyebrow>Onboarding</NocturneEyebrow>
                <h1 className={nocturnePageTitleClass}>
                  {submitted
                    ? `You’re all set${firstName ? `, ${firstName}` : ""}.`
                    : firstName
                      ? `Welcome back, ${firstName}`
                      : "Welcome to Peak Process Partners"}
                </h1>
                {submitted && (
                  <p className={nocturneLeadClass}>
                    Your onboarding has been submitted to HR. We{"’"}ll be in touch if anything else is needed.
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-baseline gap-2 sm:block sm:text-right">
                <p className="font-nocturne-display text-[2.75rem] leading-none font-semibold tracking-[-0.03em] text-nocturne-accent-text sm:text-[4rem]">
                  {percent}
                  <span className="text-[0.45em] tracking-normal">%</span>
                </p>
                <p className="text-[0.8125rem] text-nocturne-ink-muted sm:mt-1">
                  complete
                  <span aria-hidden className="text-nocturne-ink-faint"> · </span>
                  <span className="font-nocturne-mono">{doneCount}</span> of{" "}
                  <span className="font-nocturne-mono">{stepRegistry.length}</span> steps
                </p>
              </div>
            </div>

            <NocturneProgressBar percent={percent} className="mt-6" />
            <NocturneStepTimeline variant="stepper" className="mt-3.5" />

            <div className="mt-7 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <section
                aria-labelledby="nocturne-dash-next"
                className={cn(nocturneFocusCardClass, "flex flex-col items-start px-4.5 py-5 sm:px-6.5 sm:py-6")}
              >
                {submitted ? (
                  <>
                    <NocturneEyebrow>All steps done</NocturneEyebrow>
                    <h2
                      id="nocturne-dash-next"
                      className="font-nocturne-display mt-2 text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] text-nocturne-ink"
                    >
                      Submitted to HR
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <NocturnePill tone="success">
                        <Check className="mr-1 size-3.5" strokeWidth={3} aria-hidden /> Submitted
                      </NocturnePill>
                      {submittedAt && (
                        <span className="font-nocturne-mono text-xs text-nocturne-ink-muted">
                          {new Date(submittedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <NocturneEyebrow>
                      Next step · {getStepIndex(currentStep.id) + 1} of {stepRegistry.length}
                    </NocturneEyebrow>
                    <h2
                      id="nocturne-dash-next"
                      className="font-nocturne-display mt-2 text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] text-nocturne-ink"
                    >
                      {currentStep.label}
                    </h2>
                    <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">
                      {currentStep.description}
                    </p>
                    <Link href={continueHref} className={cn(nocturneButtonVariants(), "mt-6 w-full sm:w-auto")}>
                      Continue <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    {comingUp.length > 0 && (
                      <div className="mt-auto w-full pt-7">
                        <div className="border-t border-nocturne-border pt-4">
                          <p className="text-xs font-semibold text-nocturne-ink-muted">After this</p>
                          <ul className="mt-2.5 flex flex-wrap gap-2">
                            {comingUp.map((step) => (
                              <li key={step.id}>
                                <Link
                                  href={`/onboarding/${step.slug}`}
                                  className="inline-flex h-7.5 items-center gap-2 rounded-nocturne-pill bg-nocturne-raised pr-3 pl-1.5 text-[0.8125rem] text-nocturne-ink-muted transition-colors outline-none hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
                                >
                                  <span
                                    aria-hidden
                                    className={cn(
                                      "font-nocturne-mono flex size-5 items-center justify-center rounded-full text-[0.625rem] font-semibold",
                                      statuses[step.id] === "blocked"
                                        ? "text-nocturne-gold ring-[1.5px] ring-nocturne-gold ring-inset"
                                        : "bg-nocturne-card text-nocturne-ink-muted",
                                    )}
                                  >
                                    {getStepIndex(step.id) + 1}
                                  </span>
                                  {step.label}
                                  {statuses[step.id] === "blocked" && <span className="sr-only"> (incomplete)</span>}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <DocumentsPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
