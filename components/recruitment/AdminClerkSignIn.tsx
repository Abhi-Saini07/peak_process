"use client";

import { SignIn } from "@clerk/nextjs";

type ClerkColors = { primary: string; text: string; muted: string; input: string; border: string; danger: string };

/**
 * Nocturne defaults. These are CSS variables, not hex values, so Clerk follows
 * the light/dark theme switch (data-theme on <html>) without re-rendering.
 */
const NOCTURNE_COLORS: ClerkColors = {
  primary: "var(--color-nocturne-accent)",
  text: "var(--color-nocturne-ink)",
  muted: "var(--color-nocturne-ink-muted)",
  input: "var(--color-nocturne-card)",
  border: "var(--color-nocturne-border-strong)",
  danger: "var(--color-nocturne-error)",
};

interface AdminClerkSignInProps {
  /** Colours of the surrounding design, so Clerk's form blends into its card (defaults: Nocturne theme tokens). */
  colors?: Partial<ClerkColors>;
  fontFamily?: string;
  borderRadius?: string;
}

/**
 * Clerk's sign-in form, embedded inside each design's own admin card
 * (the card supplies the heading, so Clerk's header and outer card are hidden).
 * Mounted at /admin/login with path routing; Clerk's extra steps live under
 * /admin/login/* (see app/admin/login/[[...rest]]).
 */
export function AdminClerkSignIn({
  colors: colorOverrides,
  fontFamily = "var(--font-nocturne-ui)",
  borderRadius = "var(--radius-nocturne-control)",
}: AdminClerkSignInProps) {
  const colors = { ...NOCTURNE_COLORS, ...colorOverrides };
  return (
    <SignIn
      routing="path"
      path="/admin/login"
      fallbackRedirectUrl="/admin/jobs"
      withSignUp
      appearance={{
        variables: {
          colorPrimary: colors.primary,
          colorPrimaryForeground: "var(--color-nocturne-on-accent)",
          colorForeground: colors.text,
          colorMutedForeground: colors.muted,
          colorMuted: "var(--color-nocturne-raised)",
          colorNeutral: colors.text,
          colorInput: colors.input,
          colorInputForeground: colors.text,
          colorBorder: colors.border,
          colorRing: colors.primary,
          colorDanger: colors.danger,
          colorSuccess: "var(--color-nocturne-success)",
          colorWarning: "var(--color-nocturne-gold)",
          colorBackground: "var(--color-nocturne-card)",
          fontFamily,
          fontFamilyButtons: fontFamily,
          borderRadius,
        },
        elements: {
          rootBox: { width: "100%" },
          cardBox: { width: "100%", boxShadow: "none", border: "none", background: "transparent" },
          card: { padding: 0, boxShadow: "none", border: "none", background: "transparent" },
          header: { display: "none" },
          footer: { background: "transparent" },
          formButtonPrimary: { height: "2.75rem", fontSize: "0.875rem", fontWeight: 600, boxShadow: "none" },
          formFieldInput: { height: "2.75rem" },
          footerActionLink: { color: "var(--color-nocturne-accent-text)", fontWeight: 600 },
        },
      }}
    />
  );
}
