"use client";

import { ShieldAlert } from "lucide-react";
import { NocturneButton } from "@/components/nocturne/ui/NocturneButton";
import { useAdminSignOut } from "@/hooks/recruitment/useAdminSignOut";

/** Shown when someone signs in with Clerk but their email isn't in ADMIN_EMAILS. */
export function AdminNoAccess({ email }: { email: string | null }) {
  const signOut = useAdminSignOut();

  return (
    <div className="flex min-h-screen items-center justify-center bg-nocturne-bg px-4 py-10 font-nocturne-ui text-nocturne-ink">
      <div className="w-full max-w-[26rem] rounded-nocturne-card border border-nocturne-border bg-nocturne-card px-5 py-7 shadow-nocturne-lift sm:px-8 sm:py-8">
        <span className="flex size-11 items-center justify-center rounded-nocturne-control bg-nocturne-gold-tint text-nocturne-gold">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 font-nocturne-display text-[1.75rem] leading-tight font-semibold tracking-[-0.015em]">
          No HR access
        </h1>
        <p className="mt-2 text-sm text-nocturne-ink-muted">
          {email ? (
            <>
              You&apos;re signed in as <span className="font-semibold text-nocturne-ink">{email}</span>, but this
              account isn&apos;t on the HR admin list.
            </>
          ) : (
            "This account isn't on the HR admin list."
          )}{" "}
          Ask the People team to add your email, or sign in with a different account.
        </p>
        <NocturneButton type="button" variant="secondary" onClick={() => signOut()} className="mt-6 w-full">
          Sign out and use another account
        </NocturneButton>
      </div>
    </div>
  );
}
