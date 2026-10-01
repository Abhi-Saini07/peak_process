import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

// Clerk is only used by the HR admin, so its provider (and script) is scoped
// to /admin; the careers and onboarding pages don't load it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider signInUrl="/admin/login" signInFallbackRedirectUrl="/admin/jobs">
      {children}
    </ClerkProvider>
  );
}
