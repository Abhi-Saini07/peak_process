import { NocturneShell } from "@/components/nocturne/NocturneShell";
import { AppFrame } from "@/components/navigation/AppFrame";

export default function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  return (
    <AppFrame>
      <NocturneShell>{children}</NocturneShell>
    </AppFrame>
  );
}
