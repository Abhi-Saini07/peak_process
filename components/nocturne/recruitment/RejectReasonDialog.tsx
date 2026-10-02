"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { REJECT_NOTE_MAX, REJECT_REASON_OPTIONS } from "@/lib/recruitment/rejection";
import type { RejectReasonPicker } from "@/hooks/recruitment/useRejectReasonPicker";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { nocturneFieldInputVariants } from "@/components/nocturne/ui/nocturneFieldStyles";
import { KbdHint, adminEyebrowClass, adminLabelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";

/** Modal reason picker shown before an application is rejected (detail page
 *  and Kanban board). All state lives in useRejectReasonPicker. */
export function RejectReasonDialog({
  picker,
  candidateName,
  serverError,
}: {
  picker: RejectReasonPicker;
  candidateName: string;
  serverError?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const noteId = useId();
  const errorId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (picker.isOpen && !dialog.open) dialog.showModal();
    if (!picker.isOpen && dialog.open) dialog.close();
  }, [picker.isOpen]);

  const message = picker.error ?? serverError ?? null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        picker.close();
      }}
      onKeyDown={picker.handleKeyDown}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-nocturne-card border border-nocturne-border bg-nocturne-card p-0 text-nocturne-ink shadow-nocturne-menu backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      <form
        method="dialog"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void picker.submit();
        }}
        className="flex flex-col gap-4 p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={adminEyebrowClass}>Reject application</p>
            <h2 id={titleId} className="mt-1 font-nocturne-display text-lg font-semibold tracking-tight break-words">
              Why are you rejecting {candidateName}?
            </h2>
          </div>
          <button
            type="button"
            onClick={picker.close}
            aria-label="Close"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-nocturne-pill text-nocturne-ink-muted transition-colors hover:bg-nocturne-raised hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-nocturne-accent"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <fieldset>
          <legend className="sr-only">Reason</legend>
          <ul className="flex flex-col gap-1.5">
            {REJECT_REASON_OPTIONS.map((option, index) => {
              const checked = picker.reason === option.value;
              return (
                <li key={option.value}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-nocturne-control border px-3 py-2.5 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-nocturne-accent",
                      checked
                        ? "border-nocturne-accent bg-nocturne-accent-tint font-semibold"
                        : "border-nocturne-border hover:bg-nocturne-raised",
                    )}
                  >
                    <input
                      type="radio"
                      name="reject-reason"
                      value={option.value}
                      checked={checked}
                      onChange={() => picker.chooseReason(option.value)}
                      className="size-4 accent-(--color-nocturne-accent)"
                    />
                    <span className="flex-1">{option.label}</span>
                    <KbdHint>{index + 1}</KbdHint>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div>
          <label htmlFor={noteId} className={adminLabelClass}>
            Note {picker.noteRequired ? <span className="text-nocturne-error">(required)</span> : "(optional)"}
          </label>
          <textarea
            id={noteId}
            value={picker.note}
            onChange={(event) => picker.setNote(event.target.value)}
            maxLength={REJECT_NOTE_MAX}
            rows={3}
            required={picker.noteRequired}
            aria-invalid={Boolean(picker.error) || undefined}
            aria-describedby={message ? errorId : undefined}
            placeholder="Only HR can see this."
            className={cn(nocturneFieldInputVariants({ hasError: Boolean(picker.error) }), "mt-1.5 resize-y py-2.5")}
          />
        </div>

        {message && (
          <p id={errorId} role="alert" className="text-sm text-nocturne-error">
            {message}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <NocturneButton type="button" variant="secondary" size="sm" onClick={picker.close} disabled={picker.isSubmitting}>
            Cancel
          </NocturneButton>
          <NocturneButton type="submit" size="sm" isLoading={picker.isSubmitting}>
            Reject application
          </NocturneButton>
        </div>
      </form>
    </dialog>
  );
}
