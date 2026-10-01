import type { DocumentMeta, OnboardingDataSnapshot } from "@/types/onboarding";
import type { OnboardingClient, SavableStepId } from "./types";

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

export const httpOnboardingClient: OnboardingClient = {
  async getState() {
    const res = await fetch("/api/onboarding/state");
    if (!res.ok) return null;
    return (await res.json()) as OnboardingDataSnapshot;
  },

  async saveStep(step: SavableStepId, data: unknown) {
    const res = await fetch(`/api/onboarding/steps/${step}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Couldn’t save your changes."));
    }
    return (await res.json()) as { savedAt: string };
  },

  async uploadDocument(file, docId, onProgress) {
    // fetch() doesn't expose upload progress, so the bar is simulated on a
    // realistic cadence while the real request runs in the background —
    // same visual behavior as before, now backed by a real endpoint.
    let cancelled = false;
    const tick = (async () => {
      const steps = [20, 45, 70, 90];
      for (const pct of steps) {
        if (cancelled) return;
        await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 120));
        onProgress?.(pct);
      }
    })();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/onboarding/documents/${docId}`, { method: "POST", body: formData });
      cancelled = true;
      await tick;
      onProgress?.(100);
      const meta = (await res.json()) as DocumentMeta;
      if (!res.ok) {
        throw new Error(meta.errorMessage || "Upload failed. Please try again.");
      }
      return meta;
    } finally {
      cancelled = true;
    }
  },

  async removeDocument(docId) {
    const res = await fetch(`/api/onboarding/documents/${docId}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Couldn’t remove that file."));
    }
  },

  async submit() {
    // The server re-derives and re-validates the full snapshot itself
    // (see submitOnboarding in lib/server/onboardingRepository.ts) rather
    // than trusting whatever the client sends, so no body is needed here.
    const res = await fetch("/api/onboarding/submit", { method: "POST" });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, "Submission failed. Please try again."));
    }
    return (await res.json()) as { submissionId: string; submittedAt: string };
  },

  async reset() {
    await fetch("/api/onboarding/reset", { method: "POST" });
  },
};
