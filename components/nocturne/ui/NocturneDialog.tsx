"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Nocturne modal: native <dialog> (focus trap, Escape, backdrop for free),
 * card surface, eyebrow + Sora title and a close button. Open/close is
 * controlled by the caller's hook; Escape and the close button call onClose.
 */
export function NocturneDialog({
  open,
  onClose,
  eyebrow,
  title,
  children,
  className,
  onKeyDown,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: ReactNode;
  children: (ids: { titleId: string }) => ReactNode;
  className?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDialogElement>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-nocturne-card border border-nocturne-border bg-nocturne-card p-0 text-nocturne-ink shadow-nocturne-menu backdrop:bg-black/50 backdrop:backdrop-blur-[2px]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <p className="nocturne-type-eyebrow text-nocturne-accent-text">{eyebrow}</p>}
            <h2 id={titleId} className="mt-1 font-nocturne-display text-lg font-semibold tracking-tight break-words">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-nocturne-pill text-nocturne-ink-muted transition-colors hover:bg-nocturne-raised hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-nocturne-accent"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {open ? children({ titleId }) : null}
      </div>
    </dialog>
  );
}
