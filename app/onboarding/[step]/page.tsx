import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStepBySlug } from "@/lib/onboarding/steps.config";
import { StepRenderer } from "@/components/onboarding/StepRenderer";

export async function generateMetadata(props: PageProps<"/onboarding/[step]">): Promise<Metadata> {
  const { step: slug } = await props.params;
  const step = getStepBySlug(slug);
  return { title: step ? `${step.label} | Peak Process Partners` : "Onboarding" };
}

export default async function OnboardingStepPage(props: PageProps<"/onboarding/[step]">) {
  const { step: slug } = await props.params;
  const step = getStepBySlug(slug);
  if (!step) notFound();

  return <StepRenderer step={step} />;
}
