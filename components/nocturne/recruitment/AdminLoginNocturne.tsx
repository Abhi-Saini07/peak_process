"use client";

import type { ReactNode } from "react";
import { AdminClerkSignIn } from "@/components/recruitment/AdminClerkSignIn";
import { PeakMark } from "@/components/Logo";
import { NocturneThemeToggle } from "@/components/nocturne/NocturneThemeToggle";

/** Brand lockup shared by the login and no-access cards. */
export function AdminBrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <PeakMark className="size-10 shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className="font-nocturne-display text-[0.9375rem] font-semibold tracking-[-0.01em] text-nocturne-ink">
          Peak Process Partners
        </p>
        <p className="mt-0.5 nocturne-type-eyebrow text-[0.6875rem] text-nocturne-ink-muted">HR admin</p>
      </div>
    </div>
  );
}

/** Full-height page frame for the signed-out admin screens: soft accent wash, brand top-left, theme toggle top-right. */
export function AdminAuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-nocturne-bg bg-[radial-gradient(56rem_24rem_at_50%_-4rem,color-mix(in_oklab,var(--color-nocturne-accent)_16%,transparent),transparent_70%)] font-nocturne-ui text-nocturne-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[27rem] flex-col justify-center px-4 py-20 sm:py-16">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <NocturneThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminLoginNocturne() {
  return (
    <AdminAuthFrame>
      <div className="mb-7 flex justify-center">
        <AdminBrandLockup />
      </div>

      <div className="rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-5 py-7 shadow-nocturne-lift sm:px-8 sm:py-8">
        <p className="nocturne-type-eyebrow text-nocturne-accent-text">Recruitment</p>
        <h1 className="mt-2 font-nocturne-display text-[1.875rem] leading-tight font-semibold tracking-[-0.025em] text-nocturne-ink">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-nocturne-ink-muted">
          Sign in to manage job openings and applications.
        </p>

        <div className="mt-6 border-t border-nocturne-border pt-6">
          <AdminClerkSignIn />
        </div>
      </div>
    </AdminAuthFrame>
  );
}
