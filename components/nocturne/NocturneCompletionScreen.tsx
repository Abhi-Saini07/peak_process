"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { nocturneButtonVariants } from "./ui/NocturneButton";
import {
  NocturneEyebrow,
  NocturnePill,
  NocturneProgressHeader,
  nocturneCardTitleClass,
  nocturneHelpPanelClass,
  nocturneLeadClass,
  nocturneWorkPanelClass,
} from "./NocturneStepShell";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const rowClass = "flex items-center justify-between gap-4 border-b border-nocturne-border py-3";

export function NocturneCompletionScreen() {
  const submissionId = useOnboardingStore((s) => s.submissionId);
  const submittedAt = useOnboardingStore((s) => s.submittedAt);
  const fullName = useOnboardingStore((s) => s.welcome.fullName);

  return (
    <div>
      <NocturneProgressHeader className="mb-7" />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="nocturne-complete-title" className={nocturneWorkPanelClass}>
          <span className="flex size-12 items-center justify-center rounded-full bg-nocturne-success-tint text-nocturne-success">
            <Check className="size-6" strokeWidth={2.5} aria-hidden />
          </span>
          <NocturneEyebrow className="mt-5">Onboarding complete</NocturneEyebrow>
          <h1 id="nocturne-complete-title" className={nocturneCardTitleClass}>
            You{"’"}re all set{fullName ? `, ${firstName(fullName)}.` : "."}
          </h1>
          <p className={nocturneLeadClass}>
            Your onboarding information has been submitted to HR{submittedAt ? ` on ${formatDate(submittedAt)}` : ""}.
          </p>

          <dl className="mt-5 border-t border-nocturne-border text-sm">
            <div className={rowClass}>
              <dt className="text-nocturne-ink-muted">Status</dt>
              <dd>
                <NocturnePill tone="success">Submitted to HR</NocturnePill>
              </dd>
            </div>
            {submittedAt && (
              <div className={rowClass}>
                <dt className="text-nocturne-ink-muted">Submitted on</dt>
                <dd className="font-nocturne-mono text-[0.8125rem] text-nocturne-ink">{formatDate(submittedAt)}</dd>
              </div>
            )}
            {submissionId && (
              <div className={cn(rowClass, "flex-wrap gap-y-1")}>
                <dt className="text-nocturne-ink-muted">Reference ID</dt>
                <dd className="min-w-0 font-nocturne-mono text-[0.8125rem] break-all text-nocturne-ink">{submissionId}</dd>
              </div>
            )}
          </dl>

          <Link href="/dashboard" className={cn(nocturneButtonVariants(), "mt-6 w-full sm:w-auto")}>
            Return to dashboard <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>

        <section aria-labelledby="nocturne-next-steps" className={nocturneHelpPanelClass}>
          <h2 id="nocturne-next-steps" className="text-base leading-snug font-bold text-nocturne-ink">
            Next steps
          </h2>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-nocturne-ink-muted">
            HR will review your information and reach out if anything else is required. You can expect to hear from
            us within 2{"–"}3 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
