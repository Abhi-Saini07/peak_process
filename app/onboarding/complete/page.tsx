import type { Metadata } from "next";
import { NocturneCompletionScreen } from "@/components/nocturne/NocturneCompletionScreen";

export const metadata: Metadata = {
  title: "You’re all set | Peak Process Partners",
};

export default function OnboardingCompletePage() {
  return <NocturneCompletionScreen />;
}
