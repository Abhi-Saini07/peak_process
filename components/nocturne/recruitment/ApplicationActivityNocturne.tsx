"use client";

import { useId } from "react";
import { ArrowRightLeft, MessageSquareText, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/utils/formatRelativeTime";
import { applicationStatusLabel } from "@/lib/recruitment/constants";
import { rejectReasonLabel } from "@/lib/recruitment/rejection";
import { NOTE_BODY_MAX, type ActivityItem } from "@/lib/recruitment/notes";
import type { ApplicationActivity } from "@/hooks/recruitment/useApplicationActivity";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { nocturneFieldInputVariants } from "@/components/nocturne/ui/nocturneFieldStyles";
import { adminCardTitleClass, adminLabelClass, adminPanelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-3.5", n <= value ? "fill-nocturne-gold text-nocturne-gold" : "text-nocturne-border-strong")}
          aria-hidden
        />
      ))}
    </span>
  );
}

function StarRatingInput({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const name = useId();
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">Rating (optional)</legend>
      <span className={adminLabelClass} aria-hidden>
        Rating
      </span>
      <span className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value != null && n <= value;
          return (
            <label
              key={n}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-nocturne-pill transition-colors hover:bg-nocturne-raised has-focus-visible:outline-2 has-focus-visible:outline-nocturne-accent"
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => onChange(n)}
                className="sr-only"
              />
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"}
              </span>
              <Star
                className={cn("size-4.5", active ? "fill-nocturne-gold text-nocturne-gold" : "text-nocturne-ink-faint")}
                aria-hidden
              />
            </label>
          );
        })}
      </span>
      {value != null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-semibold text-nocturne-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-nocturne-accent"
        >
          Clear
        </button>
      )}
    </fieldset>
  );
}

function ActivityRow({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const Icon = item.kind === "note" ? MessageSquareText : ArrowRightLeft;
  const author = item.kind === "note" ? item.note.authorName : item.entry.changedByName;
  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {!isLast && <span className="absolute top-9 bottom-0 left-4 w-px bg-nocturne-border" aria-hidden />}
      <span
        className={cn(
          "relative inline-flex size-8 shrink-0 items-center justify-center rounded-nocturne-pill",
          item.kind === "note"
            ? "bg-nocturne-accent-tint text-nocturne-accent-text"
            : "border border-nocturne-border bg-nocturne-raised text-nocturne-ink-muted",
        )}
        aria-hidden
      >
        <Icon className="size-3.75" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          {item.kind === "note" ? (
            <span className="font-bold text-nocturne-ink">{author ?? "Former HR member"}</span>
          ) : (
            <span className="text-nocturne-ink">
              {item.entry.oldStatus ? (
                <>
                  {applicationStatusLabel(item.entry.oldStatus)} →{" "}
                  <span className="font-bold">{applicationStatusLabel(item.entry.newStatus)}</span>
                </>
              ) : (
                <span className="font-bold">Application received</span>
              )}
              {author ? <span className="text-nocturne-ink-muted"> · by {author}</span> : null}
            </span>
          )}
          <time
            dateTime={item.at}
            title={formatFull(item.at)}
            suppressHydrationWarning
            className="text-xs text-nocturne-ink-muted"
          >
            {formatRelativeTime(item.at)}
          </time>
        </p>
        {item.kind === "note" ? (
          <>
            {item.note.rating != null && <Stars value={item.note.rating} className="mt-1.5" />}
            <p className="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-line text-nocturne-ink">
              {item.note.body}
            </p>
          </>
        ) : (
          item.entry.rejectReason && (
            <div className="mt-2 rounded-nocturne-control bg-nocturne-raised px-3 py-2 text-sm">
              <span className="text-nocturne-ink-muted">Reason: </span>
              <span className="font-semibold text-nocturne-ink">{rejectReasonLabel(item.entry.rejectReason)}</span>
              {item.entry.rejectNote && (
                <p className="mt-1 break-words whitespace-pre-line text-nocturne-ink-muted">{item.entry.rejectNote}</p>
              )}
            </div>
          )
        )}
      </div>
    </li>
  );
}

/** Activity panel on the application detail page: a note composer with an
 *  optional rating, then status changes and notes, newest first. */
export function ApplicationActivityNocturne({ activity }: { activity: ApplicationActivity }) {
  const { items, average, ratedCount, composer } = activity;
  const noteId = useId();
  const errorId = useId();

  return (
    <section className={cn(adminPanelClass, "px-4 py-5.5 sm:px-6.5")} aria-labelledby={`${noteId}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${noteId}-title`} className={adminCardTitleClass}>
          Activity
        </h2>
        {average != null && (
          <span className="inline-flex items-center gap-2 text-sm text-nocturne-ink-muted">
            <Stars value={Math.round(average)} />
            <span>
              <span className="nocturne-mono font-semibold text-nocturne-ink">{average.toFixed(1)}</span> from {ratedCount}{" "}
              {ratedCount === 1 ? "rating" : "ratings"}
            </span>
          </span>
        )}
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void composer.submit();
        }}
        className="mt-4 flex flex-col gap-3 rounded-nocturne-card border border-nocturne-border bg-nocturne-surface p-3.5 sm:p-4"
      >
        <label htmlFor={noteId} className="sr-only">
          Add a note
        </label>
        <textarea
          id={noteId}
          value={composer.body}
          onChange={(event) => composer.setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void composer.submit();
            }
          }}
          rows={3}
          maxLength={NOTE_BODY_MAX}
          placeholder="Add a note for the hiring team…"
          aria-invalid={Boolean(composer.error) || undefined}
          aria-describedby={composer.error ? errorId : undefined}
          className={cn(nocturneFieldInputVariants({ hasError: Boolean(composer.error) }), "resize-y py-2.5")}
        />
        {composer.error && (
          <p id={errorId} role="alert" className="text-sm text-nocturne-error">
            {composer.error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StarRatingInput value={composer.rating} onChange={composer.setRating} />
          <div className="flex items-center gap-3">
            <span className="nocturne-mono hidden text-xs text-nocturne-ink-faint sm:inline">
              {composer.body.length}/{NOTE_BODY_MAX}
            </span>
            <NocturneButton type="submit" size="sm" isLoading={composer.isSaving}>
              Add note
            </NocturneButton>
          </div>
        </div>
      </form>

      {items.length === 0 ? (
        <p className="mt-5 text-sm text-nocturne-ink-muted">No activity yet.</p>
      ) : (
        <ol className="mt-6 flex flex-col">
          {items.map((item, index) => (
            <ActivityRow key={item.id} item={item} isLast={index === items.length - 1} />
          ))}
        </ol>
      )}
    </section>
  );
}
