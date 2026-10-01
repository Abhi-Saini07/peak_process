"use client";

import type { StepConfig } from "@/lib/onboarding/steps.config";

/** Renders the current step's component. Each one reads the shared logic
 *  hook underneath (hooks/steps/*), so this file only picks the screen. */
export function StepRenderer({ step }: { step: StepConfig }) {
  const Component = step.Component;
  return <Component />;
}
