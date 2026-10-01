"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useOnboardingStore } from "@/lib/store/onboardingStore";
import { nocturneButtonVariants } from "./ui/NocturneButton";
import {
  NocturneEyebrow,
  NocturnePageBar,
  NocturnePill,
  nocturneHelpPanelClass,
  nocturneLeadClass,
  nocturnePageTitleClass,
} from "./NocturneStepShell";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function NocturneCompletionScreen() {
  const submissionId = useOnboardingStore((s) => s.submissionId);
  const submittedAt = useOnboardingStore((s) => s.submittedAt);
  const fullName = useOnboardingStore((s) => s.welcome.fullName);

  return (
    <div>
      <NocturnePageBar trail={["Onboarding", "Complete"]} />

      <span className="flex size-12 items-center justify-center rounded-full bg-nocturne-success-tint text-nocturne-success">
        <Check className="size-6" strokeWidth={2.5} aria-hidden />
      </span>
      <NocturneEyebrow className="mt-5">Peak Process Partners</NocturneEyebrow>
      <h1 className={nocturnePageTitleClass}>
        You{"’"}re all set
        {fullName ? (
          <>
            , <em className="text-nocturne-accent-text italic">{firstName(fullName)}.</em>
          </>
        ) : (
          "."
        )}
      </h1>
      <p className={nocturneLeadClass}>
        Your onboarding information has been submitted to HR{submittedAt ? ` on ${formatDate(submittedAt)}` : ""}.
      </p>

      <div className="mt-6 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="rounded-nocturne-card border border-nocturne-border bg-nocturne-card shadow-nocturne-rest">
          <dl className="text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-nocturne-border px-4 py-3.5 sm:px-5">
              <dt className="text-nocturne-ink-muted">Status</dt>
              <dd>
                <NocturnePill tone="success">Submitted to HR</NocturnePill>
              </dd>
            </div>
            {submittedAt && (
              <div className="flex items-center justify-between gap-4 border-b border-nocturne-border px-4 py-3.5 sm:px-5">
                <dt className="text-nocturne-ink-muted">Submitted on</dt>
                <dd className="font-nocturne-mono text-[0.8125rem] text-nocturne-ink">{formatDate(submittedAt)}</dd>
              </div>
            )}
            {submissionId && (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-nocturne-border px-4 py-3.5 sm:px-5">
                <dt className="text-nocturne-ink-muted">Reference ID</dt>
                <dd className="min-w-0 font-nocturne-mono text-[0.8125rem] break-all text-nocturne-ink">{submissionId}</dd>
              </div>
            )}
          </dl>
          <div className="px-4 py-4 sm:px-5">
            <Link href="/dashboard" className={cn(nocturneButtonVariants(), "w-full sm:w-auto")}>
              Return to dashboard <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <section aria-labelledby="nocturne-next-steps" className={nocturneHelpPanelClass}>
          <h2 id="nocturne-next-steps" className="font-nocturne-display text-[1.1875rem] leading-snug font-semibold text-nocturne-ink">
            Next steps
          </h2>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-nocturne-ink-muted">
            HR will review your information and reach out if anything else is required. You can expect to hear from
            us within 2{"–"}3 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
