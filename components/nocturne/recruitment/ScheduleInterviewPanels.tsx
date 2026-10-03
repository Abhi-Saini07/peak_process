"use client";

import { CalendarCheck, CalendarClock, CalendarDays, MapPin, Video } from "lucide-react";
import type { ScheduleState } from "@/lib/server/interviewRepository";
import { interviewModeLabel } from "@/lib/recruitment/interviews";
import { useBookedInterviewActions, useLocalDateTime, useSlotPicker } from "@/hooks/recruitment/useSchedulePage";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { cn } from "@/lib/utils/cn";

const scheduleTitleClass =
  "mt-2.5 font-nocturne-display text-[clamp(1.5rem,1.25rem+1.2vw,2.125rem)] leading-[1.12] font-semibold tracking-[-0.025em] text-balance text-nocturne-ink";

function ScheduleBadge({ icon: Icon }: { icon: typeof CalendarDays }) {
  return (
    <span className="flex size-12 items-center justify-center rounded-full bg-nocturne-gold-tint text-nocturne-gold">
      <Icon className="size-5.5" aria-hidden />
    </span>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-nocturne-control bg-nocturne-error-tint px-3 py-2 text-sm text-nocturne-error">
      {children}
    </p>
  );
}

/** Interactive parts of /schedule/[token]: the slot picker and the booked view. */
export function SlotPicker({ token, state }: { token: string; state: Extract<ScheduleState, { kind: "pending" }> }) {
  const picker = useSlotPicker(token, state.slots);
  return (
    <>
      <ScheduleBadge icon={CalendarDays} />
      <p className="nocturne-type-eyebrow mt-6 text-nocturne-gold">Interview · {state.jobTitle}</p>
      <h1 className={scheduleTitleClass}>Choose a time, {state.firstName}.</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">
        A {state.durationMinutes}-minute {interviewModeLabel(state.mode).toLowerCase()}.{" "}
        {picker.timeZone ? (
          <>
            Times are shown in your timezone, <strong className="text-nocturne-ink">{picker.timeZone}</strong>.
          </>
        ) : (
          "Loading times in your timezone…"
        )}
      </p>

      <div className="mt-6 flex flex-col gap-5" aria-busy={!picker.days}>
        {picker.days?.length === 0 && (
          <p className="rounded-nocturne-control bg-nocturne-surface px-4 py-3 text-sm text-nocturne-ink-muted">
            All the times on this link have been taken. Reply to your invitation email and we&apos;ll send new ones.
          </p>
        )}
        {picker.days?.map((day) => (
          <fieldset key={day.key} className="flex flex-col gap-2.5">
            <legend className="mb-2.5 text-sm font-bold text-nocturne-ink">{day.label}</legend>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
              {day.slots.map((slot) => {
                const active = picker.selected === slot.iso;
                return (
                  <button
                    key={slot.iso}
                    type="button"
                    aria-pressed={active}
                    onClick={() => picker.select(slot.iso)}
                    className={cn(
                      "h-10 rounded-nocturne-control border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent",
                      active
                        ? "border-nocturne-accent bg-nocturne-accent text-nocturne-on-accent hover:bg-nocturne-accent-hover"
                        : "border-nocturne-border-strong bg-nocturne-card text-nocturne-ink hover:border-nocturne-accent hover:bg-nocturne-accent-tint",
                    )}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-7 -mb-8 flex flex-col gap-3 rounded-b-nocturne-card border-t border-nocturne-border bg-nocturne-card px-5 pt-4 pb-5 shadow-[0_-8px_16px_-12px_rgb(0_0_0/0.25)] sm:-mx-10 sm:-mb-10 sm:px-10 sm:pb-6">
        {picker.error && <ErrorText>{picker.error}</ErrorText>}
        <NocturneButton onClick={picker.book} isLoading={picker.isBooking} disabled={!picker.selected} showArrow>
          {picker.selected ? "Confirm this time" : "Pick a time above"}
        </NocturneButton>
      </div>
    </>
  );
}

export function BookedInterview({ token, state }: { token: string; state: Extract<ScheduleState, { kind: "booked" }> }) {
  const when = useLocalDateTime(state.scheduledAt);
  const actions = useBookedInterviewActions(token);
  return (
    <>
      <ScheduleBadge icon={CalendarCheck} />
      <p className="nocturne-type-eyebrow mt-6 text-nocturne-gold">You&apos;re booked · {state.jobTitle}</p>
      <h1 className={scheduleTitleClass}>See you then, {state.firstName}.</h1>
      <dl className="mt-6 flex flex-col gap-3 rounded-nocturne-card bg-nocturne-surface p-4 text-sm">
        <div className="flex gap-3">
          <dt className="sr-only">When</dt>
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
          <dd className="font-semibold text-nocturne-ink">{when?.text ?? "…"}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="sr-only">Format</dt>
          <Video className="mt-0.5 size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
          <dd className="text-nocturne-ink">
            {interviewModeLabel(state.mode)}, {state.durationMinutes} minutes
            {state.meetingUrl && (
              <>
                {" · "}
                <a href={state.meetingUrl} className="font-semibold text-nocturne-accent-text underline underline-offset-4" target="_blank" rel="noreferrer">
                  Meeting link
                </a>
              </>
            )}
          </dd>
        </div>
        {state.location && (
          <div className="flex gap-3">
            <dt className="sr-only">Where</dt>
            <MapPin className="mt-0.5 size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
            <dd className="text-nocturne-ink">{state.location}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex flex-col gap-3">
        {actions.error && <ErrorText>{actions.error}</ErrorText>}
        <a href={`/api/schedule/${token}/ics`} className="inline-flex h-11 items-center justify-center gap-2 rounded-nocturne-control bg-nocturne-accent px-5 text-sm font-bold text-nocturne-on-accent shadow-nocturne-rest hover:bg-nocturne-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent">
          <CalendarDays className="size-4" aria-hidden />
          Add to calendar (.ics)
        </a>
        {actions.confirmingCancel ? (
          <div role="group" aria-label="Confirm cancellation" className="flex flex-col gap-3 rounded-nocturne-card border border-nocturne-border-strong p-4">
            <p className="text-sm text-nocturne-ink">Cancel this interview? You won&apos;t be able to book again from this link.</p>
            <div className="flex flex-wrap gap-2">
              <NocturneButton size="sm" onClick={actions.cancel} isLoading={actions.pending === "cancel"}>
                Yes, cancel it
              </NocturneButton>
              <NocturneButton size="sm" variant="secondary" onClick={actions.keep} disabled={actions.pending !== null}>
                Keep it
              </NocturneButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <NocturneButton variant="secondary" onClick={actions.reschedule} isLoading={actions.pending === "reschedule"}>
              Reschedule
            </NocturneButton>
            <NocturneButton variant="secondary" onClick={actions.askCancel} disabled={actions.pending !== null}>
              Cancel
            </NocturneButton>
          </div>
        )}
      </div>
    </>
  );
}
