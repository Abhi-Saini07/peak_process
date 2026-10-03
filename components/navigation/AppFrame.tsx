import type { ReactNode } from "react";
import { AppSidebar } from "@/components/navigation/AppSidebar";
import { OnboardingHydrator } from "@/lib/store/OnboardingHydrator";

/** Wraps internal pages (dashboard, onboarding, HR admin) with the app
 *  sidebar. The page's own shell renders unchanged beside it. Onboarding
 *  state is loaded here, not in the root layout, so public pages (careers,
 *  onboarding links) never create an anonymous onboarding session. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="tablet:flex">
      <OnboardingHydrator />
      <AppSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
