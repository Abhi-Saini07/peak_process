import { create } from "zustand";
import type { DocumentMeta, OnboardingDataSnapshot, SaveStatus } from "@/types/onboarding";
import { onboardingClient } from "@/lib/persistence/onboardingClient";
import type { SavableStepId } from "@/lib/persistence/types";
import { welcomeDefaults } from "@/lib/schemas/welcome.schema";
import { personalInfoDefaults } from "@/lib/schemas/personalInfo.schema";
import { referencesDefaults } from "@/lib/schemas/references.schema";
import { emergencyContactDefaults } from "@/lib/schemas/emergencyContact.schema";
import { healthInsuranceDefaults } from "@/lib/schemas/healthInsurance.schema";

export interface OnboardingStoreState extends OnboardingDataSnapshot {
  hasHydrated: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: string | null;
  uploadProgress: Record<string, number>;

  hydrate: () => Promise<void>;
  saveStep: (step: SavableStepId, data: unknown) => Promise<void>;
  uploadDocument: (file: File, docId: string) => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;
  submitOnboarding: () => Promise<{ submissionId: string } | { error: string }>;
  resetOnboarding: () => Promise<void>;
}

function initialData(): OnboardingDataSnapshot {
  return {
    welcome: { ...welcomeDefaults },
    personalInfo: { ...personalInfoDefaults },
    references: { ...referencesDefaults },
    emergencyContact: { ...emergencyContactDefaults },
    healthInsurance: { ...healthInsuranceDefaults },
    documents: {},
    submitted: false,
    submissionId: null,
    submittedAt: null,
  };
}

export const useOnboardingStore = create<OnboardingStoreState>()((set, get) => ({
  hasHydrated: false,
  saveStatus: "idle",
  saveError: null,
  lastSavedAt: null,
  uploadProgress: {},
  ...initialData(),

  hydrate: async () => {
    // Hydration must never leave the shell stuck on its loading skeleton —
    // fall back to defaults (already the initial state) if it fails.
    try {
      const remote = await onboardingClient.getState();
      if (remote) {
        set({ ...remote, hasHydrated: true });
      } else {
        set({ hasHydrated: true });
      }
    } catch {
      set({ hasHydrated: true });
    }
  },

  saveStep: async (step, data) => {
    set({ saveStatus: "saving", saveError: null });
    try {
      const { savedAt } = await onboardingClient.saveStep(step, data);
      set({ [step]: data, saveStatus: "saved", lastSavedAt: savedAt } as Partial<OnboardingStoreState>);
    } catch (err) {
      set({
        saveStatus: "error",
        saveError: err instanceof Error ? err.message : "Couldn’t save your changes.",
      });
    }
  },

  uploadDocument: async (file, docId) => {
    const pendingMeta: DocumentMeta = {
      id: `${docId}-pending`,
      docId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      status: "uploading",
    };

    set((s) => ({
      documents: { ...s.documents, [docId]: pendingMeta },
      uploadProgress: { ...s.uploadProgress, [docId]: 0 },
    }));

    try {
      const meta = await onboardingClient.uploadDocument(file, docId, (percent) => {
        set((s) => ({ uploadProgress: { ...s.uploadProgress, [docId]: percent } }));
      });
      set((s) => ({ documents: { ...s.documents, [docId]: meta } }));
    } catch (err) {
      set((s) => ({
        documents: {
          ...s.documents,
          [docId]: {
            ...pendingMeta,
            status: "error",
            errorMessage: err instanceof Error ? err.message : "Upload failed. Please try again.",
          },
        },
      }));
    }
  },

  removeDocument: async (docId) => {
    await onboardingClient.removeDocument(docId);
    set((s) => {
      const documents = { ...s.documents };
      delete documents[docId];
      const uploadProgress = { ...s.uploadProgress };
      delete uploadProgress[docId];
      return { documents, uploadProgress };
    });
  },

  submitOnboarding: async () => {
    set({ saveStatus: "saving", saveError: null });
    const s = get();
    const snapshot: OnboardingDataSnapshot = {
      welcome: s.welcome,
      personalInfo: s.personalInfo,
      references: s.references,
      emergencyContact: s.emergencyContact,
      healthInsurance: s.healthInsurance,
      documents: s.documents,
      submitted: s.submitted,
      submissionId: s.submissionId,
      submittedAt: s.submittedAt,
    };

    try {
      const { submissionId, submittedAt } = await onboardingClient.submit(snapshot);
      set({ submitted: true, submissionId, submittedAt, saveStatus: "saved" });
      return { submissionId };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed. Please try again.";
      set({ saveStatus: "error", saveError: message });
      return { error: message };
    }
  },

  resetOnboarding: async () => {
    await onboardingClient.reset();
    set({ ...initialData(), hasHydrated: true, saveStatus: "idle", lastSavedAt: null });
  },
}));
