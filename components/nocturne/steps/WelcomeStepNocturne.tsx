"use client";

import { Clock } from "lucide-react";
import { useWelcomeStepLogic } from "@/hooks/steps/useWelcomeStepLogic";
import { stepRegistry } from "@/lib/onboarding/steps.config";
import { NocturneTextField } from "../ui/NocturneTextField";
import { NocturneButton } from "../ui/NocturneButton";
import { NocturneSaveIndicator } from "../NocturneSaveIndicator";
import {
  NocturneEyebrow,
  NocturnePageBar,
  nocturneHelpPanelClass,
  nocturneLeadClass,
  nocturnePageTitleClass,
  nocturneWorkPanelClass,
} from "../NocturneStepShell";

const READY_LIST = [
  "Your Aadhaar and PAN numbers, plus your UAN if you’ve worked before",
  "A photo or scan of a government ID and an address proof",
  "Contact details for two professional references",
  "Your emergency contact’s name and phone number",
];

/** Step 1 has its own layout (name field + Begin in a work panel beside the
 *  "Before you begin" checklist), so it composes the shell's pieces rather
 *  than using NocturneStepShell's form + footer. */
export function WelcomeStepNocturne() {
  const { register, errors, isSubmitting, firstName, onContinue } = useWelcomeStepLogic();
  const total = stepRegistry.length;

  return (
    <div>
      <NocturnePageBar
        trail={["Onboarding", "Welcome"]}
        right={<NocturneSaveIndicator idleLabel={`Step 1 of ${total} · saves automatically`} />}
      />

      <NocturneEyebrow>Step 1 of {total} · Welcome</NocturneEyebrow>
      <h1 className={nocturnePageTitleClass}>
        Welcome aboard,{" "}
        {firstName ? <em className="text-nocturne-accent-text italic">{firstName}.</em> : <>new hire.</>}
      </h1>
      <p className={nocturneLeadClass}>
        This portal will guide you through every step of your onboarding — personal details, benefits, and required
        documents. It should take about 10–15 minutes.
      </p>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 sm:gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className={nocturneWorkPanelClass}>
          <NocturneTextField
            label="Your full name"
            required
            placeholder="e.g. Priya Sharma"
            autoComplete="name"
            autoFocus
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <NocturneButton
              type="button"
              onClick={onContinue}
              isLoading={isSubmitting}
              showArrow
              className="w-full sm:w-auto"
            >
              Begin onboarding
            </NocturneButton>
            <span className="inline-flex items-center justify-center gap-1.5 text-[0.8125rem] text-nocturne-ink-muted">
              <Clock className="size-3.5" aria-hidden /> About 10–15 minutes
            </span>
          </div>
        </div>

        <section aria-labelledby="nocturne-before-you-begin" className={nocturneHelpPanelClass}>
          <h2
            id="nocturne-before-you-begin"
            className="font-nocturne-display text-[1.375rem] leading-tight font-semibold text-nocturne-ink"
          >
            Before you begin
          </h2>
          <p className="mt-1 text-[0.8125rem] text-nocturne-ink-muted">Have a few things on hand:</p>
          <ol className="mt-4 grid gap-3">
            {READY_LIST.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm leading-normal text-nocturne-ink">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full bg-nocturne-accent text-[0.6875rem] font-bold text-nocturne-on-accent"
                >
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
