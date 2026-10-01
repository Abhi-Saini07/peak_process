"use client";

import { CircleAlert } from "lucide-react";
import { useReviewStepLogic } from "@/hooks/steps/useReviewStepLogic";
import { NocturneReviewSection } from "../NocturneReviewSection";
import { NocturneCheckbox } from "../ui/NocturneCheckbox";
import { NocturneStepShell } from "../NocturneStepShell";

export function ReviewStepNocturne() {
  const {
    statuses,
    reviewSteps,
    allOtherComplete,
    summaries,
    confirmed,
    setConfirmed,
    submitError,
    isSubmitting,
    onSubmit,
  } = useReviewStepLogic();

  return (
    <NocturneStepShell
      stepId="review"
      title="Review & Submit"
      description="Please review your information carefully before submitting. Once submitted, you’ll need to contact HR to make further changes."
      onContinue={onSubmit}
      continueLabel="Submit onboarding"
      continueDisabled={!confirmed || !allOtherComplete}
      isSubmitting={isSubmitting}
    >
      <div>
        {reviewSteps.map((step) => (
          <NocturneReviewSection
            key={step.id}
            title={step.label}
            status={statuses[step.id]}
            href={`/onboarding/${step.slug}`}
            summary={summaries[step.id]}
          />
        ))}
      </div>

      {!allOtherComplete && (
        <p className="mt-4 flex items-center gap-2 rounded-nocturne-control bg-nocturne-gold-tint px-3.5 py-2.5 text-[0.8125rem] font-medium text-nocturne-gold">
          <CircleAlert className="size-4 shrink-0" /> Finish the sections above before submitting.
        </p>
      )}

      {submitError && (
        <p className="mt-4 flex items-center gap-2 rounded-nocturne-control bg-nocturne-error-tint px-3.5 py-2.5 text-[0.8125rem] font-medium text-nocturne-error">
          <CircleAlert className="size-4 shrink-0" /> {submitError}
        </p>
      )}

      <div className="mt-5 rounded-nocturne-control border border-nocturne-border bg-nocturne-surface px-4 py-3.5">
        <NocturneCheckbox
          label="I confirm the information provided is accurate to the best of my knowledge."
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
      </div>
    </NocturneStepShell>
  );
}
