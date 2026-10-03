"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { GovernmentIds } from "@/types/employees";

type IdsForm = { aadhaar: string; pan: string; uan: string };

/**
 * Government IDs on the employee page: masked until "Reveal", which asks the
 * server (and is written to the audit log). The values sit in a small form
 * only because NocturneMaskedField is a react-hook-form field.
 */
export function useGovernmentIdReveal(employeeId: string, masked: { aadhaar: string | null; pan: string | null; uan: string | null }) {
  const [revealed, setRevealed] = useState<GovernmentIds | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<IdsForm>({
    values: revealed
      ? { aadhaar: revealed.aadhaar ?? "", pan: revealed.pan ?? "", uan: revealed.uan ?? "" }
      : { aadhaar: masked.aadhaar ?? "", pan: masked.pan ?? "", uan: masked.uan ?? "" },
  });

  async function reveal() {
    setIsRevealing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}/reveal-ids`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.error ?? "Couldn't reveal the IDs.");
      else setRevealed(data as GovernmentIds);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsRevealing(false);
    }
  }

  return {
    control: form.control,
    isRevealed: revealed !== null,
    hide: () => setRevealed(null),
    reveal,
    isRevealing,
    error,
    hasAny: Boolean(masked.aadhaar || masked.pan || masked.uan),
  };
}

/** "New onboarding link": issues a fresh link and shows it once. */
export function useOnboardingLinkReissue(employeeId: string) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function reissue() {
    setIsWorking(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/employees/${employeeId}/onboarding-link`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.error ?? "Couldn't create a link.");
      else {
        setUrl(data.onboardingUrl as string);
        router.refresh();
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsWorking(false);
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return { url, reissue, isWorking, error, copy, copied };
}
