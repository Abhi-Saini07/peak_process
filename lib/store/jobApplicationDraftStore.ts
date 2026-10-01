import { create } from "zustand";
import type { JobApplicationFormInput } from "@/lib/schemas/application.schema";

/**
 * In-progress (pre-submission) job application field values, keyed by job
 * id — lets a design switch (which unmounts one design's form component and
 * mounts another) survive without losing what the applicant already typed
 * or picked, the same way onboarding survives a design switch via its
 * global store. No `persist` middleware: this only needs to outlive a
 * design-mode change within the same session, not a page reload.
 */
interface DraftEntry {
  values: Partial<JobApplicationFormInput>;
  resumeFile: File | null;
  otherFile: File | null;
}

const EMPTY_ENTRY: DraftEntry = { values: {}, resumeFile: null, otherFile: null };

interface JobApplicationDraftState {
  drafts: Record<string, DraftEntry>;
  updateValues: (jobId: string, values: Partial<JobApplicationFormInput>) => void;
  setResumeFile: (jobId: string, file: File | null) => void;
  setOtherFile: (jobId: string, file: File | null) => void;
  clearDraft: (jobId: string) => void;
}

export const useJobApplicationDraftStore = create<JobApplicationDraftState>()((set) => ({
  drafts: {},
  updateValues: (jobId, values) =>
    set((s) => ({
      drafts: {
        ...s.drafts,
        [jobId]: { ...(s.drafts[jobId] ?? EMPTY_ENTRY), values: { ...(s.drafts[jobId]?.values ?? {}), ...values } },
      },
    })),
  setResumeFile: (jobId, file) =>
    set((s) => ({ drafts: { ...s.drafts, [jobId]: { ...(s.drafts[jobId] ?? EMPTY_ENTRY), resumeFile: file } } })),
  setOtherFile: (jobId, file) =>
    set((s) => ({ drafts: { ...s.drafts, [jobId]: { ...(s.drafts[jobId] ?? EMPTY_ENTRY), otherFile: file } } })),
  clearDraft: (jobId) =>
    set((s) => {
      const drafts = { ...s.drafts };
      delete drafts[jobId];
      return { drafts };
    }),
}));

export function getDraft(jobId: string): DraftEntry {
  return useJobApplicationDraftStore.getState().drafts[jobId] ?? EMPTY_ENTRY;
}
