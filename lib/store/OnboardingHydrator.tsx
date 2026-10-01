"use client";

import { useEffect } from "react";
import { useOnboardingStore } from "./onboardingStore";

/**
 * Client-only bootstrap: the store starts with in-memory defaults (server
 * has no localStorage), then this hydrates from persistence on mount.
 * Rendered once in the root layout, outside any specific route.
 */
export function OnboardingHydrator() {
  const hydrate = useOnboardingStore((s) => s.hydrate);
  const hasHydrated = useOnboardingStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      void hydrate();
    }
  }, [hasHydrated, hydrate]);

  return null;
}
