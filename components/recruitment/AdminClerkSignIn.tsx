"use client";

import { SignIn } from "@clerk/nextjs";

interface AdminClerkSignInProps {
  /** Colours of the surrounding design, so Clerk's form blends into its card. */
  colors: { primary: string; text: string; muted: string; input: string; border: string; danger: string };
  fontFamily?: string;
  borderRadius?: string;
}

/**
 * Clerk's sign-in form, embedded inside each design's own admin card
 * (the card supplies the heading, so Clerk's header and outer card are hidden).
 * Mounted at /admin/login with path routing; Clerk's extra steps live under
 * /admin/login/* (see app/admin/login/[[...rest]]).
 */
export function AdminClerkSignIn({ colors, fontFamily, borderRadius = "0.625rem" }: AdminClerkSignInProps) {
  return (
    <SignIn
      routing="path"
      path="/admin/login"
      fallbackRedirectUrl="/admin/jobs"
      withSignUp
      appearance={{
        variables: {
          colorPrimary: colors.primary,
          colorForeground: colors.text,
          colorMutedForeground: colors.muted,
          colorInput: colors.input,
          colorInputForeground: colors.text,
          colorBorder: colors.border,
          colorDanger: colors.danger,
          colorBackground: "transparent",
          fontFamily,
          borderRadius,
        },
        elements: {
          rootBox: { width: "100%" },
          cardBox: { width: "100%", boxShadow: "none", border: "none", background: "transparent" },
          card: { padding: 0, boxShadow: "none", border: "none", background: "transparent" },
          header: { display: "none" },
          footer: { background: "transparent" },
        },
      }}
    />
  );
}
