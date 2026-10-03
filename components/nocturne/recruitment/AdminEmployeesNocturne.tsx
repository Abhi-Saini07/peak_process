"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy, Eye, EyeOff, FileText, Link2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatBytes } from "@/lib/utils/formatBytes";
import { useGovernmentIdReveal, useOnboardingLinkReissue } from "@/hooks/recruitment/useEmployeeRecord";
import { NocturneMaskedField } from "@/components/nocturne/ui/NocturneMaskedField";
import { NocturneButton, nocturneButtonVariants } from "@/components/nocturne/ui/NocturneButton";
import {
  AdminPageHeading,
  adminCardTitleClass,
  adminLabelClass,
  adminPanelClass,
} from "@/components/nocturne/recruitment/AdminShellNocturne";
import type { EmployeeDetail, EmployeeSummary } from "@/types/employees";
import type { StepStatus } from "@/types/onboarding";
import { genderOptions } from "@/lib/schemas/shared";
import { coverageTypeOptions } from "@/lib/schemas/healthInsurance.schema";

function optionLabel(options: readonly { value: string; label: string }[], value: string | undefined): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function EmployeeStatusPill({ status }: { status: EmployeeSummary["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-6.5 items-center gap-1.5 rounded-nocturne-pill px-2.5 text-xs font-semibold whitespace-nowrap",
        status === "submitted" ? "bg-nocturne-success-tint text-nocturne-success" : "bg-nocturne-gold-tint text-nocturne-gold",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status === "submitted" ? "Submitted" : "In progress"}
    </span>
  );
}

function CompletionBar({ percent }: { percent: number }) {
  return (
    <span className="flex min-w-32 items-center gap-2.5">
      <span
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-nocturne-raised"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Onboarding completion"
      >
        <span className="block h-full rounded-full bg-nocturne-accent" style={{ width: `${percent}%` }} />
      </span>
      <span className="nocturne-mono w-10 text-right text-xs font-semibold text-nocturne-ink">{percent}%</span>
    </span>
  );
}

const GRID = "xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]";

export function AdminEmployeesListNocturne({ employees }: { employees: EmployeeSummary[] }) {
  return (
    <div>
      <AdminPageHeading
        eyebrow="People · Employees"
        title="Employees"
        lead="New hires and their onboarding progress. Anonymous sessions with no details yet aren't listed."
      />
      {employees.length === 0 ? (
        <div className={cn(adminPanelClass, "mt-7 px-6 py-14 text-center")}>
          <p className="font-nocturne-display text-xl font-semibold text-nocturne-ink">No employees yet</p>
          <p className="mt-1.5 text-sm text-nocturne-ink-muted">Mark someone as hired from their application to start onboarding.</p>
        </div>
      ) : (
        <div className="mt-7 xl:overflow-hidden xl:rounded-nocturne-card xl:border xl:border-nocturne-border xl:bg-nocturne-card xl:shadow-nocturne-rest">
          <div
            className={cn("hidden items-center gap-4 border-b border-nocturne-border bg-nocturne-table-head px-5 py-3 xl:grid", adminLabelClass, GRID)}
            aria-hidden
          >
            <span>Employee</span>
            <span>Hired for</span>
            <span>Onboarding</span>
            <span>Status</span>
            <span className="w-24" />
          </div>
          <ul className="flex flex-col gap-3 xl:gap-0">
            {employees.map((e) => (
              <li
                key={e.id}
                className={cn(
                  "grid grid-cols-1 gap-3 rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-4 py-4 shadow-nocturne-rest sm:px-5",
                  "xl:items-center xl:gap-4 xl:rounded-none xl:border-0 xl:border-b xl:py-3.5 xl:shadow-none xl:last:border-b-0 xl:hover:bg-nocturne-raised",
                  GRID,
                )}
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/employees/${e.id}`}
                    className="rounded-sm text-[0.9375rem] font-bold text-nocturne-ink hover:text-nocturne-accent-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
                  >
                    {e.name}
                  </Link>
                  <p className="mt-0.5 truncate text-[0.8125rem] text-nocturne-ink-muted">
                    {e.email ?? "No email yet"}
                    {e.submissionReference && <span className="nocturne-mono"> · {e.submissionReference}</span>}
                  </p>
                </div>
                <p className="text-[0.8125rem] text-nocturne-ink-muted">
                  {e.hiredFor ? <span className="text-nocturne-ink">{e.hiredFor.jobTitle}</span> : "Direct onboarding"}
                </p>
                <CompletionBar percent={e.completionPercent} />
                <div>
                  <EmployeeStatusPill status={e.status} />
                </div>
                <Link
                  href={`/admin/employees/${e.id}`}
                  className={nocturneButtonVariants({ variant: "secondary", size: "sm", className: "h-8.5 w-24 justify-self-start px-3" })}
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const STEP_TONE: Record<StepStatus, string> = {
  completed: "bg-nocturne-success-tint text-nocturne-success",
  current: "bg-nocturne-accent-tint text-nocturne-accent-text",
  blocked: "bg-nocturne-gold-tint text-nocturne-gold",
  upcoming: "bg-nocturne-raised text-nocturne-ink-muted",
};
const STEP_LABEL: Record<StepStatus, string> = { completed: "Done", current: "Next", blocked: "Incomplete", upcoming: "Not started" };

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className={adminLabelClass}>{label}</dt>
      <dd className={cn("mt-1.5 text-sm font-medium break-words", value ? "text-nocturne-ink" : "text-nocturne-ink-faint", mono && "nocturne-mono")}>
        {value || "—"}
      </dd>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className={cn(adminPanelClass, "px-4 py-5.5 sm:px-6.5")} aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={adminCardTitleClass}>{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function GovernmentIdsPanel({ employee }: { employee: EmployeeDetail }) {
  const ids = useGovernmentIdReveal(employee.id, employee.maskedIds);
  return (
    <Panel
      title="Government IDs"
      action={
        ids.hasAny &&
        (ids.isRevealed ? (
          <NocturneButton type="button" size="sm" variant="secondary" onClick={ids.hide}>
            <EyeOff className="size-4" aria-hidden />
            Hide
          </NocturneButton>
        ) : (
          <NocturneButton type="button" size="sm" variant="secondary" onClick={() => void ids.reveal()} isLoading={ids.isRevealing}>
            <Eye className="size-4" aria-hidden />
            Reveal
          </NocturneButton>
        ))
      }
    >
      {ids.hasAny ? (
        <>
          <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3" key={ids.isRevealed ? "revealed" : "masked"}>
            <NocturneMaskedField control={ids.control} name="aadhaar" placeholder="Not entered" label="Aadhaar" fullLength={12} readOnly allowToggle={false} defaultRevealed={ids.isRevealed} />
            <NocturneMaskedField control={ids.control} name="pan" placeholder="Not entered" label="PAN" fullLength={10} readOnly allowToggle={false} defaultRevealed={ids.isRevealed} />
            <NocturneMaskedField control={ids.control} name="uan" placeholder="Not entered" label="UAN" fullLength={12} readOnly allowToggle={false} defaultRevealed={ids.isRevealed} />
          </div>
          <p className="mt-1 flex items-start gap-2 text-xs text-nocturne-ink-muted">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Revealing the full numbers is recorded in the audit log with your name.
          </p>
          {ids.error && (
            <p role="alert" className="mt-2 text-sm text-nocturne-error">
              {ids.error}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-nocturne-ink-muted">Not entered yet.</p>
      )}
    </Panel>
  );
}

function OnboardingLinkPanel({ employee }: { employee: EmployeeDetail }) {
  const link = useOnboardingLinkReissue(employee.id);
  const invite = employee.latestInvite;
  if (employee.status === "submitted") return null;
  return (
    <Panel title="Onboarding link">
      <p className="text-sm text-nocturne-ink-muted">
        {invite
          ? invite.usedAt
            ? `Opened on ${formatDate(invite.usedAt)}.`
            : new Date(invite.expiresAt) < new Date()
              ? `The last link expired on ${formatDate(invite.expiresAt)}.`
              : `A link was sent and works until ${formatDate(invite.expiresAt)}.`
          : "No onboarding link has been sent."}
      </p>
      {link.url && (
        <div className="mt-3 flex flex-col gap-2 rounded-nocturne-control bg-nocturne-raised p-3">
          <p className="text-xs text-nocturne-ink-muted">New link (shown once, valid 14 days). Older unused links no longer work.</p>
          <code className="nocturne-mono text-xs break-all text-nocturne-ink">{link.url}</code>
          <NocturneButton type="button" size="sm" variant="secondary" onClick={() => void link.copy()} className="self-start">
            <Copy className="size-4" aria-hidden />
            {link.copied ? "Copied" : "Copy link"}
          </NocturneButton>
        </div>
      )}
      <NocturneButton type="button" size="sm" variant="secondary" className="mt-3" onClick={() => void link.reissue()} isLoading={link.isWorking}>
        <Link2 className="size-4" aria-hidden />
        New onboarding link
      </NocturneButton>
      {link.error && (
        <p role="alert" className="mt-2 text-sm text-nocturne-error">
          {link.error}
        </p>
      )}
    </Panel>
  );
}

export function AdminEmployeeDetailNocturne({ employee }: { employee: EmployeeDetail }) {
  const pi = employee.personalInfo;
  const refs = employee.references;
  const ec = employee.emergencyContact;
  const hi = employee.healthInsurance;
  return (
    <div>
      <Link
        href="/admin/employees"
        className="mb-4 inline-flex h-8 items-center gap-1.5 rounded-nocturne-pill border border-nocturne-border bg-nocturne-card pr-3.5 pl-2.5 text-[0.8125rem] font-semibold text-nocturne-ink-muted shadow-nocturne-rest transition-colors hover:border-nocturne-border-strong hover:text-nocturne-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nocturne-accent"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Employees
      </Link>
      <AdminPageHeading
        eyebrow="People · Employee"
        title={employee.name}
        lead={
          <>
            {employee.hiredFor ? `Hired for ${employee.hiredFor.jobTitle}` : "Direct onboarding"}
            {employee.submissionReference && (
              <>
                {" · "}Reference <span className="nocturne-mono text-nocturne-ink">{employee.submissionReference}</span>
              </>
            )}
          </>
        }
        action={<EmployeeStatusPill status={employee.status} />}
      />

      <div className="mt-7 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Personal information">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field label="First name" value={pi.basicInfo?.firstName} />
              <Field label="Last name" value={pi.basicInfo?.lastName} />
              <Field label="Date of birth" value={pi.basicInfo?.dateOfBirth} mono />
              <Field label="Gender" value={optionLabel(genderOptions, pi.basicInfo?.gender)} />
              <Field label="Email" value={pi.contactInfo?.personalEmail} />
              <Field label="Phone" value={pi.contactInfo?.phone} mono />
              <div className="sm:col-span-2">
                <Field label="Home address" value={pi.address?.homeAddress} />
              </div>
            </dl>
          </Panel>
          <GovernmentIdsPanel employee={employee} />
          <Panel title="References">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {(["primaryReference", "secondaryReference"] as const).map((key) => {
                const r = refs[key];
                return (
                  <dl key={key} className="flex flex-col gap-4">
                    <Field label={key === "primaryReference" ? "Primary" : "Secondary"} value={r?.name} />
                    <Field label="Relationship" value={r?.relationship} />
                    <Field label="Company" value={r?.company} />
                    <Field label="Email" value={r?.email} />
                    <Field label="Phone" value={r?.phone} mono />
                  </dl>
                );
              })}
            </div>
          </Panel>
          <Panel title="Emergency contact">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field label="Name" value={ec.name} />
              <Field label="Relationship" value={ec.relationship} />
              <Field label="Phone" value={ec.primaryPhone} mono />
              <Field label="Second phone" value={ec.secondaryPhone} mono />
              <div className="sm:col-span-2">
                <Field label="Address" value={ec.sameAsHomeAddress ? "Same as home address" : ec.address} />
              </div>
            </dl>
          </Panel>
          <Panel title="Health insurance">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field label="Coverage" value={optionLabel(coverageTypeOptions, hi.coverageType)} />
              <Field label="Nominee" value={hi.nomineeName ? `${hi.nomineeName} (${hi.nomineeRelationship ?? "—"})` : null} />
              <div className="sm:col-span-2">
                <Field
                  label="Dependents"
                  value={(hi.dependents ?? []).map((d) => `${d.name} (${d.relationship})`).join(", ") || null}
                />
              </div>
            </dl>
          </Panel>
        </div>

        <aside className="flex min-w-0 flex-col gap-3.5 lg:sticky lg:top-6">
          <Panel title="Onboarding">
            <CompletionBar percent={employee.completionPercent} />
            <ol className="mt-4 flex flex-col gap-2">
              {employee.steps.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-nocturne-ink">{s.label}</span>
                  <span className={cn("rounded-nocturne-pill px-2 py-0.5 text-xs font-semibold", STEP_TONE[s.status])}>
                    {STEP_LABEL[s.status]}
                  </span>
                </li>
              ))}
            </ol>
            {employee.submittedAt && (
              <p className="mt-3 text-xs text-nocturne-ink-muted">Submitted on {formatDate(employee.submittedAt)}</p>
            )}
          </Panel>
          <OnboardingLinkPanel employee={employee} />
          <Panel title="Documents">
            {employee.documents.length === 0 ? (
              <p className="text-sm text-nocturne-ink-muted">Nothing uploaded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {employee.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 text-sm">
                    <FileText className="size-4 shrink-0 text-nocturne-ink-muted" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-nocturne-ink">{d.fileName || d.docId}</span>
                    <span className="nocturne-mono shrink-0 text-xs text-nocturne-ink-muted">
                      {d.status === "provided" ? "From HR" : formatBytes(d.fileSize)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {employee.hiredFor && (
            <Link
              href={`/admin/applications/${employee.hiredFor.applicationId}`}
              className={cn(nocturneButtonVariants({ variant: "secondary", size: "sm" }), "self-start")}
            >
              View job application
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
