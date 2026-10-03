"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { groupSlotsByDay } from "@/lib/recruitment/slots";

const noopSubscribe = () => () => {};

/** The viewer's timezone, read after hydration (null on the server render). */
export function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    () => null,
  );
}

async function post(url: string, body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return (data as { error?: string }).error ?? "Something went wrong. Please try again.";
  } catch {
    return "Couldn't reach the server. Check your connection and try again.";
  }
}

/** Picking and booking a time on /schedule/[token]. Times show in the viewer's zone. */
export function useSlotPicker(token: string, slots: readonly string[]) {
  const router = useRouter();
  const timeZone = useBrowserTimeZone();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const days = timeZone ? groupSlotsByDay(slots, timeZone) : null;

  async function book() {
    if (!selected) {
      setError("Pick a time first.");
      return;
    }
    setIsBooking(true);
    setError(null);
    const failure = await post(`/api/schedule/${token}/book`, { slot: selected });
    setIsBooking(false);
    if (failure) {
      setError(failure);
      setSelected(null);
    }
    router.refresh();
  }

  return {
    timeZone,
    days,
    selected,
    select: (iso: string) => {
      setSelected(iso);
      setError(null);
    },
    error,
    isBooking,
    book,
  };
}

/** Reschedule (reopens the link) and cancel (with a confirm step) for a booked interview. */
export function useBookedInterviewActions(token: string) {
  const router = useRouter();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [pending, setPending] = useState<"cancel" | "reschedule" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "cancel" | "reschedule") {
    setPending(action);
    setError(null);
    const failure = await post(`/api/schedule/${token}/${action}`);
    setPending(null);
    if (failure) setError(failure);
    setConfirmingCancel(false);
    router.refresh();
  }

  return {
    confirmingCancel,
    askCancel: () => setConfirmingCancel(true),
    keep: () => setConfirmingCancel(false),
    cancel: () => run("cancel"),
    reschedule: () => run("reschedule"),
    pending,
    error,
  };
}

/** One instant formatted in the viewer's zone (null until hydrated). */
export function useLocalDateTime(iso: string): { text: string; timeZone: string } | null {
  const timeZone = useBrowserTimeZone();
  if (!timeZone) return null;
  const text = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
  return { text, timeZone };
}
