import type { ReactNode } from "react";
import { AppSidebar } from "@/components/navigation/AppSidebar";

/** Wraps internal pages (dashboard, onboarding, HR admin) with the app
 *  sidebar. The page's own shell renders unchanged beside it. */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="tablet:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
