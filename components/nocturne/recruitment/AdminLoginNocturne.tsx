"use client";

import { AdminClerkSignIn } from "@/components/recruitment/AdminClerkSignIn";

/** The Peak mark on forest, matching the app sidebar. */
function ForestMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-10 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-nocturne-forest" />
      <path d="M7 22.5L13.5 10L17 16.2L19.8 11.6L25 22.5H7Z" className="fill-nocturne-forest-gold" />
    </svg>
  );
}

export function AdminLoginNocturne() {
  return (
    <div className="min-h-screen bg-nocturne-bg font-nocturne-ui text-nocturne-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[26rem] flex-col items-stretch justify-center px-4 py-10">
        <div className="mb-6 flex items-center justify-center gap-3">
          <ForestMark />
          <div className="leading-tight">
            <p className="text-[0.9375rem] font-bold text-nocturne-ink">Peak Process Partners</p>
            <p className="mt-0.5 text-[0.6875rem] font-semibold tracking-widest text-nocturne-ink-muted uppercase">HR Admin</p>
          </div>
        </div>

        <div className="rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-5 py-7 shadow-nocturne-lift sm:px-8 sm:py-8">
          <h1 className="font-nocturne-display text-[1.875rem] leading-tight font-semibold tracking-[-0.015em] text-nocturne-ink">
            Admin sign in
          </h1>
          <p className="mt-1.5 text-sm text-nocturne-ink-muted">Sign in to manage job openings and applications.</p>

          <div className="mt-6">
            <AdminClerkSignIn
              colors={{ primary: "#1f6f54", text: "#16271f", muted: "#56675f", input: "#ffffff", border: "#86938c", danger: "#b3413a" }}
              fontFamily="var(--font-manrope), sans-serif"
              borderRadius="0.625rem"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
