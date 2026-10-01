import type { DocumentMeta, OnboardingDataSnapshot } from "@/types/onboarding";
import { welcomeDefaults } from "@/lib/schemas/welcome.schema";
import { personalInfoDefaults } from "@/lib/schemas/personalInfo.schema";
import { referencesDefaults } from "@/lib/schemas/references.schema";
import { emergencyContactDefaults } from "@/lib/schemas/emergencyContact.schema";
import { healthInsuranceDefaults } from "@/lib/schemas/healthInsurance.schema";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";
import { storageAdapter } from "./storageAdapter";
import { shouldForceError, simulateNetwork } from "./simulateNetwork";
import type { OnboardingClient, SavableStepId } from "./types";

const STATE_KEY = "state";

function seedState(): OnboardingDataSnapshot {
  const documents: Record<string, DocumentMeta> = {};
  const offerLetter = DOCUMENT_REQUIREMENTS.find((doc) => doc.providedByHR);
  if (offerLetter) {
    documents[offerLetter.id] = {
      id: `${offerLetter.id}-hr-provided`,
      docId: offerLetter.id,
      fileName: "Offer_Letter_PeakProcessPartners.pdf",
      fileSize: 0,
      fileType: "application/pdf",
      uploadedAt: new Date().toISOString(),
      status: "provided",
    };
  }

  return {
    welcome: { ...welcomeDefaults },
    personalInfo: { ...personalInfoDefaults },
    references: { ...referencesDefaults },
    emergencyContact: { ...emergencyContactDefaults },
    healthInsurance: { ...healthInsuranceDefaults },
    documents,
    submitted: false,
    submissionId: null,
    submittedAt: null,
  };
}

function readState(): OnboardingDataSnapshot {
  return storageAdapter.read<OnboardingDataSnapshot>(STATE_KEY) ?? seedState();
}

function writeState(state: OnboardingDataSnapshot): void {
  storageAdapter.write(STATE_KEY, state);
}

export const localOnboardingClient: OnboardingClient = {
  async getState() {
    await simulateNetwork({ delayMs: [150, 350] });
    return readState();
  },

  async saveStep(step: SavableStepId, data: unknown) {
    await simulateNetwork({ delayMs: [250, 550], failRate: 0 });
    const state = readState();
    (state as unknown as Record<SavableStepId, unknown>)[step] = data;
    writeState(state);
    return { savedAt: new Date().toISOString() };
  },

  async uploadDocument(file, docId, onProgress) {
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 120));
      onProgress?.(Math.round((i / steps) * 100));
    }

    if (shouldForceError() || Math.random() < 0.08) {
      throw new Error("Upload failed — the connection was interrupted. Please try again.");
    }

    const meta: DocumentMeta = {
      id: `${docId}-${Date.now()}`,
      docId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
    };

    const state = readState();
    state.documents[docId] = meta;
    writeState(state);

    return meta;
  },

  async removeDocument(docId) {
    await simulateNetwork({ delayMs: [150, 300] });
    const state = readState();
    delete state.documents[docId];
    writeState(state);
  },

  async submit(finalData) {
    await simulateNetwork({ delayMs: [700, 1200], failRate: 0.06 });
    const submissionId = `PPP-${Date.now().toString(36).toUpperCase()}`;
    const submittedAt = new Date().toISOString();
    writeState({ ...finalData, submitted: true, submissionId, submittedAt });
    return { submissionId, submittedAt };
  },

  async reset() {
    storageAdapter.remove(STATE_KEY);
  },
};
