"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  manualInterviewSchema,
  scheduleInviteSchema,
  type InterviewMode,
  type InterviewStatus,
} from "@/lib/recruitment/interviews";
import { requestJson } from "@/lib/utils/requestJson";

type FieldErrors = Partial<Record<string, string>>;

function firstErrors(issues: readonly { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

/** yyyy-mm-dd in the browser's calendar, `days` from today. */
function localDate(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type CommonValues = {
  interviewerAdminId: string;
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string;
  location: string;
};

function commonDefaults(defaultInterviewerId: string): CommonValues {
  return { interviewerAdminId: defaultInterviewerId, durationMinutes: 45, mode: "video", meetingUrl: "", location: "" };
}

/**
 * "Schedule interview": a time picked in the admin's own timezone
 * (datetime-local), sent as an ISO instant and checked with the same Zod
 * schema as the API.
 */
export function useManualInterviewForm(applicationId: string, defaultInterviewerId: string) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState({ ...commonDefaults(defaultInterviewerId), localDateTime: "", notes: "", notifyCandidate: true });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key === "localDateTime" ? "scheduledAt" : key]: undefined, form: undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const when = values.localDateTime ? new Date(values.localDateTime) : null;
    const parsed = manualInterviewSchema.safeParse({ ...values, scheduledAt: when && !Number.isNaN(when.getTime()) ? when.toISOString() : "" });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.issues));
      return;
    }
    setIsSubmitting(true);
    const result = await requestJson(`/api/admin/applications/${applicationId}/interviews`, "POST", parsed.data);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setIsOpen(false);
    router.refresh();
  }

  return {
    isOpen,
    open: () => {
      setValues({ ...commonDefaults(defaultInterviewerId), localDateTime: "", notes: "", notifyCandidate: true });
      setErrors({});
      setIsOpen(true);
    },
    close: () => !isSubmitting && setIsOpen(false),
    values,
    set,
    errors,
    isSubmitting,
    submit,
  };
}
export type ManualInterviewForm = ReturnType<typeof useManualInterviewForm>;

/** "Send scheduling link": creates the invite, emails it, and shows the link once to copy. */
export function useScheduleInviteForm(applicationId: string, defaultInterviewerId: string) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const fresh = () => ({ ...commonDefaults(defaultInterviewerId), windowStartDate: localDate(1), windowEndDate: localDate(8) });
  const [values, setValues] = useState(fresh);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = scheduleInviteSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.issues));
      return;
    }
    setIsSubmitting(true);
    const result = await requestJson(`/api/admin/applications/${applicationId}/schedule-invites`, "POST", parsed.data);
    setIsSubmitting(false);
    if (!result.ok) {
      setErrors({ form: result.error });
      return;
    }
    setLink(typeof result.data.link === "string" ? result.data.link : null);
    router.refresh();
  }

  return {
    isOpen,
    open: () => {
      setValues(fresh());
      setErrors({});
      setLink(null);
      setCopied(false);
      setIsOpen(true);
    },
    close: () => !isSubmitting && setIsOpen(false),
    values,
    set,
    errors,
    isSubmitting,
    submit,
    link,
    copied,
    copyLink: async () => {
      if (!link) return;
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    },
  };
}
export type ScheduleInviteForm = ReturnType<typeof useScheduleInviteForm>;

/** Row actions: mark completed / no-show / cancelled, and withdraw a pending link. */
export function useInterviewRowActions() {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  async function run(id: string, call: () => ReturnType<typeof requestJson>) {
    setBusyId(id);
    setError(null);
    const result = await call();
    setBusyId(null);
    setConfirmCancelId(null);
    if (!result.ok) setError(result.error);
    router.refresh();
  }

  return {
    busyId,
    error,
    confirmCancelId,
    askCancel: (id: string) => setConfirmCancelId(id),
    keep: () => setConfirmCancelId(null),
    setStatus: (id: string, status: Exclude<InterviewStatus, "scheduled">, notifyCandidate = true) =>
      run(id, () => requestJson(`/api/admin/interviews/${id}`, "PATCH", { status, notifyCandidate })),
    cancelInvite: (id: string) => run(id, () => requestJson(`/api/admin/schedule-invites/${id}/cancel`, "POST")),
  };
}
export type InterviewRowActions = ReturnType<typeof useInterviewRowActions>;
