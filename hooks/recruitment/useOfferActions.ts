"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { offerInputSchema, todayISO, type OfferDetails, type OfferInput } from "@/lib/recruitment/offers";

function plusDaysISO(days: number): string {
  return todayISO(Date.now() + days * 24 * 60 * 60 * 1000);
}

function defaultsFor(existing: OfferDetails | null): OfferInput {
  if (existing) return existing;
  return { salary: "" as unknown as number, currency: "INR", startDate: plusDaysISO(30), expiresOn: plusDaysISO(7), note: "" };
}

async function postJson(url: string, body?: unknown): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: (data as { error?: string }).error ?? "Something went wrong. Try again." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
  }
}

/** The offer form: open/close, the fields (same Zod schema as the API) and submit. */
export function useOfferForm(applicationId: string, existing: OfferDetails | null) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<OfferInput, unknown, OfferDetails>({
    resolver: zodResolver(offerInputSchema),
    defaultValues: defaultsFor(existing),
  });

  const submit = form.handleSubmit(async (data) => {
    setServerError(null);
    const result = await postJson(`/api/admin/applications/${applicationId}/offer`, data);
    if (!result.ok) {
      setServerError(result.error);
      return;
    }
    setIsOpen(false);
    router.refresh();
  });

  return {
    isOpen,
    open: () => {
      form.reset(defaultsFor(existing));
      setServerError(null);
      setIsOpen(true);
    },
    close: () => setIsOpen(false),
    register: form.register,
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
    serverError,
    submit,
    isRevision: existing !== null,
  };
}

export type OfferForm = ReturnType<typeof useOfferForm>;

/** "Mark as hired", with a confirm step, and the one-time onboarding link it returns. */
export function useHireAction(applicationId: string) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isHiring, setIsHiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function hire() {
    setIsHiring(true);
    setError(null);
    const result = await postJson(`/api/admin/applications/${applicationId}/hire`);
    setIsHiring(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    setOnboardingUrl((result.data.onboardingUrl as string | null) ?? null);
    router.refresh();
  }

  async function copyLink() {
    if (!onboardingUrl) return;
    try {
      await navigator.clipboard.writeText(onboardingUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return {
    confirming,
    askToConfirm: () => {
      setError(null);
      setConfirming(true);
    },
    cancel: () => setConfirming(false),
    hire,
    isHiring,
    error,
    onboardingUrl,
    copyLink,
    copied,
  };
}

export type HireAction = ReturnType<typeof useHireAction>;
