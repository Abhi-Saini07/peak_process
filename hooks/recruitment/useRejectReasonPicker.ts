"use client";

import { useState, type KeyboardEvent } from "react";
import {
  rejectReasonForShortcut,
  validateRejectInput,
  type RejectInput,
  type RejectReason,
} from "@/lib/recruitment/rejection";

/**
 * State for the reject-reason picker. Number keys 1–8 pick a reason (except
 * while typing in the note), and submit runs the same validateRejectInput()
 * the API route uses. `onConfirm` resolves to true when the change went
 * through, which closes the picker.
 */
export function useRejectReasonPicker(onConfirm: (input: RejectInput) => Promise<boolean>) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<RejectReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function open() {
    setReason(null);
    setNote("");
    setError(null);
    setIsOpen(true);
  }

  function close() {
    if (isSubmitting) return;
    setIsOpen(false);
  }

  function chooseReason(value: RejectReason) {
    setReason(value);
    setError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLTextAreaElement || event.metaKey || event.ctrlKey || event.altKey) return;
    const shortcut = rejectReasonForShortcut(event.key);
    if (!shortcut) return;
    event.preventDefault();
    chooseReason(shortcut);
  }

  async function submit() {
    const check = validateRejectInput({ reason, note });
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const done = await onConfirm(check.value);
    setIsSubmitting(false);
    if (done) setIsOpen(false);
  }

  return {
    isOpen,
    open,
    close,
    reason,
    chooseReason,
    note,
    setNote: (value: string) => {
      setNote(value);
      setError(null);
    },
    error,
    isSubmitting,
    handleKeyDown,
    submit,
    noteRequired: reason === "other",
  };
}

export type RejectReasonPicker = ReturnType<typeof useRejectReasonPicker>;
