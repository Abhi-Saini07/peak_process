import { httpOnboardingClient } from "./httpOnboardingClient";
import { localOnboardingClient } from "./localOnboardingClient";
import type { OnboardingClient } from "./types";

/**
 * The single import point components and the store use for persistence.
 * Defaults to the real MySQL-backed API now that it exists
 * (lib/server/onboardingRepository.ts + app/api/onboarding/**). Set
 * NEXT_PUBLIC_PERSISTENCE_MODE=local to fall back to the original
 * localStorage-only mock (offline demos, UI work with no DATABASE_URL
 * configured) — both implement the same OnboardingClient interface, so
 * nothing else in the app needs to know which one is active.
 */
export const onboardingClient: OnboardingClient =
  process.env.NEXT_PUBLIC_PERSISTENCE_MODE === "local" ? localOnboardingClient : httpOnboardingClient;

export type { OnboardingClient, SavableStepId } from "./types";
