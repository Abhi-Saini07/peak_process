import type { Metadata } from "next";
import { PeopleListPage } from "@/app/admin/(protected)/people";

export const metadata: Metadata = { title: "Onboarding | Peak Process Partners" };

/** New hires still filling in their onboarding. */
export default function AdminOnboardingPage() {
  return <PeopleListPage group="onboarding" />;
}
