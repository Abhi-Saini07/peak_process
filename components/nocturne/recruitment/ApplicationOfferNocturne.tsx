"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Copy, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  OFFER_AGE_LABEL,
  OFFER_NOTE_MAX,
  formatMoney,
  offerAge,
  type OfferAge,
} from "@/lib/recruitment/offers";
import type { OfferForm, HireAction } from "@/hooks/recruitment/useOfferActions";
import { NocturneDialog } from "@/components/nocturne/ui/NocturneDialog";
import { NocturneButton, nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import { NocturneTextField } from "@/components/nocturne/ui/NocturneTextField";
import { NocturneCheckbox } from "@/components/nocturne/ui/NocturneCheckbox";
import { NocturneTextareaField } from "@/components/nocturne/ui/NocturneTextareaField";
import { adminCardTitleClass, adminLabelClass, adminPanelClass } from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { ApplicationDetail } from "@/types/recruitment";

const AGE_TONE: Record<OfferAge, string> = {
  fresh: "bg-nocturne-success-tint text-nocturne-success",
  aging: "bg-nocturne-gold-tint text-nocturne-gold",
  stale: "bg-nocturne-error-tint text-nocturne-error",
  expiring: "bg-nocturne-gold-tint text-nocturne-gold",
  expired: "bg-nocturne-error-tint text-nocturne-error",
};

export function OfferAgeBadge({ age, className }: { age: OfferAge; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6.5 items-center rounded-nocturne-pill px-2.5 text-xs font-semibold whitespace-nowrap",
        AGE_TONE[age],
        className,
      )}
    >
      {OFFER_AGE_LABEL[age]}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The offer form, in a dialog. */
export function OfferDialogNocturne({ form, candidateName }: { form: OfferForm; candidateName: string }) {
  return (
    <NocturneDialog
      open={form.isOpen}
      onClose={form.close}
      eyebrow={form.isRevision ? "Revise offer" : "Make an offer"}
      title={`Offer for ${candidateName}`}
      className="max-w-lg"
    >
      {() => (
        <form noValidate onSubmit={form.submit} className="flex flex-col gap-1">
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <NocturneTextField
              label="Yearly salary"
              type="number"
              min={1}
              inputMode="numeric"
              required
              className="nocturne-mono"
              error={form.errors.salary?.message}
              {...form.register("salary")}
            />
            <NocturneTextField
              label="Currency"
              required
              maxLength={3}
              className="nocturne-mono uppercase"
              error={form.errors.currency?.message}
              {...form.register("currency")}
            />
          </div>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
            <NocturneTextField
              label="Start date"
              type="date"
              required
              className="nocturne-mono"
              error={form.errors.startDate?.message}
              {...form.register("startDate")}
            />
            <NocturneTextField
              label="Offer expires on"
              type="date"
              required
              className="nocturne-mono"
              error={form.errors.expiresOn?.message}
              {...form.register("expiresOn")}
            />
          </div>
          <NocturneTextareaField
            label="Note to the candidate"
            rows={4}
            maxLength={OFFER_NOTE_MAX}
            helperText="Optional. Included in the offer email."
            error={form.errors.note?.message}
            {...form.register("note")}
          />
          <NocturneCheckbox
            id="offer-notify-candidate"
            checked={form.notifyCandidate}
            onChange={(event) => form.setNotifyCandidate(event.target.checked)}
            label="Notify candidate (emails the offer)"
          />
          {form.serverError && (
            <p role="alert" className="text-sm text-nocturne-error">
              {form.serverError}
            </p>
          )}
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <NocturneButton type="button" variant="secondary" size="sm" onClick={form.close} disabled={form.isSubmitting}>
              Cancel
            </NocturneButton>
            <NocturneButton type="submit" size="sm" isLoading={form.isSubmitting}>
              <Send className="size-4" aria-hidden />
              {form.isRevision ? "Save offer" : "Send offer"}
            </NocturneButton>
          </div>
        </form>
      )}
    </NocturneDialog>
  );
}

/**
 * The offer card on the application page: "Make offer" once they're at
 * interview, the offer itself with its age while it's out, "Mark as hired",
 * and the employee record once hired.
 */
export function ApplicationOfferPanelNocturne({
  application,
  form,
  hire,
  now,
}: {
  application: ApplicationDetail;
  form: OfferForm;
  hire: HireAction;
  now: number;
}) {
  const { status, offer, employeeId } = application;
  if (status !== "interview" && !offer && !employeeId) return null;

  return (
    <section className={cn(adminPanelClass, "flex flex-col gap-4 px-5 py-5.5 sm:px-6")} aria-label="Offer">
      <div className="flex items-center justify-between gap-3">
        <h2 className={adminCardTitleClass}>Offer</h2>
        {offer && status === "offered" && <OfferAgeBadge age={offerAge(offer.sentAt, offer.details.expiresOn, now)} />}
      </div>

      {!offer && status === "interview" && (
        <>
          <p className="text-sm text-nocturne-ink-muted">Ready to make an offer? The candidate moves to Offered.</p>
          <NocturneButton type="button" size="sm" onClick={form.open} className="self-start">
            <Send className="size-4" aria-hidden />
            Make offer
          </NocturneButton>
        </>
      )}

      {offer && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="col-span-2">
            <dt className={adminLabelClass}>Salary</dt>
            <dd className="nocturne-mono mt-1 text-base font-semibold text-nocturne-ink">
              {formatMoney(offer.details.salary, offer.details.currency)}
              <span className="font-nocturne-ui text-xs font-medium text-nocturne-ink-muted"> / year</span>
            </dd>
          </div>
          <div>
            <dt className={adminLabelClass}>Start</dt>
            <dd className="mt-1 text-sm font-medium text-nocturne-ink">{formatDate(offer.details.startDate)}</dd>
          </div>
          <div>
            <dt className={adminLabelClass}>Expires</dt>
            <dd className="mt-1 text-sm font-medium text-nocturne-ink">{formatDate(offer.details.expiresOn)}</dd>
          </div>
          <div className="col-span-2">
            <dt className={adminLabelClass}>Sent</dt>
            <dd className="mt-1 text-sm font-medium text-nocturne-ink">{formatDate(offer.sentAt)}</dd>
          </div>
          {offer.details.note && (
            <div className="col-span-2">
              <dt className={adminLabelClass}>Note</dt>
              <dd className="mt-1 text-sm whitespace-pre-line text-nocturne-ink-muted">{offer.details.note}</dd>
            </div>
          )}
        </dl>
      )}

      {status === "offered" && !employeeId && (
        <div className="flex flex-col gap-2.5 border-t border-nocturne-border pt-4">
          {hire.confirming ? (
            <>
              <p className="text-sm text-nocturne-ink">
                Mark {application.candidateName} as hired? This creates their employee record and an onboarding link.
              </p>
              <div className="flex flex-wrap gap-2">
                <NocturneButton type="button" size="sm" onClick={() => void hire.hire()} isLoading={hire.isHiring}>
                  <BadgeCheck className="size-4" aria-hidden />
                  Yes, mark as hired
                </NocturneButton>
                <NocturneButton type="button" size="sm" variant="secondary" onClick={hire.cancel} disabled={hire.isHiring}>
                  Cancel
                </NocturneButton>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2">
              <NocturneButton type="button" size="sm" onClick={hire.askToConfirm}>
                <BadgeCheck className="size-4" aria-hidden />
                Mark as hired
              </NocturneButton>
              <NocturneButton type="button" size="sm" variant="secondary" onClick={form.open}>
                Revise offer
              </NocturneButton>
            </div>
          )}
          {hire.error && (
            <p role="alert" className="text-sm text-nocturne-error">
              {hire.error}
            </p>
          )}
        </div>
      )}

      {employeeId && (
        <div className="flex flex-col gap-3 border-t border-nocturne-border pt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-nocturne-success">
            <BadgeCheck className="size-4" aria-hidden />
            Hired
          </p>
          {hire.onboardingUrl && (
            <div className="flex flex-col gap-2 rounded-nocturne-control bg-nocturne-raised p-3">
              <p className="text-xs text-nocturne-ink-muted">
                Onboarding link (shown once, valid 14 days). It is also emailed to the candidate.
              </p>
              <code className="nocturne-mono text-xs break-all text-nocturne-ink">{hire.onboardingUrl}</code>
              <NocturneButton type="button" size="sm" variant="secondary" onClick={() => void hire.copyLink()} className="self-start">
                <Copy className="size-4" aria-hidden />
                {hire.copied ? "Copied" : "Copy link"}
              </NocturneButton>
            </div>
          )}
          <Link
            href={`/admin/employees/${employeeId}`}
            className={cn(nocturneButtonVariants({ variant: "secondary", size: "sm" }), "self-start")}
          >
            View employee record
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}
