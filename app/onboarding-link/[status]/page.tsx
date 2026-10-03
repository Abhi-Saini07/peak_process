import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  OnboardingLinkStatusNocturne,
  type OnboardingLinkStatus,
} from "@/components/nocturne/recruitment/OnboardingLinkStatusNocturne";

const STATUSES: readonly OnboardingLinkStatus[] = ["invalid", "expired", "used"];

export const metadata: Metadata = { title: "Onboarding link | Peak Process Partners", robots: { index: false } };

export default async function OnboardingLinkStatusPage(props: PageProps<"/onboarding-link/[status]">) {
  const { status } = await props.params;
  if (!STATUSES.includes(status as OnboardingLinkStatus)) notFound();
  return <OnboardingLinkStatusNocturne status={status as OnboardingLinkStatus} />;
}
