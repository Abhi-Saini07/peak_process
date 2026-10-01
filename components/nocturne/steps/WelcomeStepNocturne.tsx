"use client";

import { useWelcomeStepLogic } from "@/hooks/steps/useWelcomeStepLogic";
import { stepRegistry } from "@/lib/onboarding/steps.config";
import { cn } from "@/lib/utils/cn";
import { NocturneTextField } from "../ui/NocturneTextField";
import { NocturneButton } from "../ui/NocturneButton";
import { NocturneSaveIndicator } from "../NocturneSaveIndicator";
import {
  NocturneEyebrow,
  NocturneProgressHeader,
  nocturneCardTitleClass,
  nocturneHelpPanelClass,
  nocturneLeadClass,
  nocturneWorkPanelClass,
} from "../NocturneStepShell";

const READY_LIST = [
  "Your Aadhaar and PAN numbers, plus your UAN if you’ve worked before",
  "A photo or scan of a government ID and an address proof",
  "Contact details for two professional references",
  "Your emergency contact’s name and phone number",
];

/** Step 1 has its own layout (name field + Begin in the focus card beside
 *  the "Before you begin" checklist), so it composes the shell's pieces
 *  rather than using NocturneStepShell's form + footer. */
export function WelcomeStepNocturne() {
  const { register, errors, isSubmitting, firstName, onContinue } = useWelcomeStepLogic();
  const total = stepRegistry.length;

  return (
    <div>
      <NocturneProgressHeader className="mb-7" />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-labelledby="nocturne-welcome-title" className={nocturneWorkPanelClass}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <NocturneEyebrow>
              Step 1 of {total}
            </NocturneEyebrow>
            <NocturneSaveIndicator idleLabel="Saves automatically" />
          </div>
          <h1 id="nocturne-welcome-title" className={cn(nocturneCardTitleClass, "sm:text-[2.125rem]")}>
            Welcome aboard, {firstName ? `${firstName}.` : "new hire."}
          </h1>
          <p className={cn(nocturneLeadClass, "leading-[1.65]")}>
            This portal will guide you through every step of your onboarding — personal details, benefits, and
            required documents. It should take about 10–15 minutes.
          </p>

          <div className="mt-5 max-w-sm">
            <NocturneTextField
              label="Your full name"
              required
              placeholder="e.g. Priya Sharma"
              autoComplete="name"
              autoFocus
              error={errors.fullName?.message}
              {...register("fullName")}
            />
          </div>
          <NocturneButton
            type="button"
            onClick={onContinue}
            isLoading={isSubmitting}
            showArrow
            className="mt-2 w-full sm:w-auto"
          >
            Begin
          </NocturneButton>
        </section>

        <section aria-labelledby="nocturne-before-you-begin" className={nocturneHelpPanelClass}>
          <h2 id="nocturne-before-you-begin" className="text-base leading-snug font-bold text-nocturne-ink">
            Before you begin
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-nocturne-ink-muted">Have a few things on hand:</p>
          <ol className="mt-4 grid gap-3.5">
            {READY_LIST.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm leading-normal text-nocturne-ink">
                <span
                  aria-hidden
                  className="font-nocturne-mono flex h-5.5 min-w-7 shrink-0 items-center justify-center rounded-nocturne-pill bg-nocturne-raised text-[0.6875rem] font-semibold text-nocturne-accent-text"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-nocturne-border pt-3.5 text-[0.8125rem] text-nocturne-ink-muted">
            Takes about 10–15 minutes.
          </p>
        </section>
      </div>
    </div>
  );
}
