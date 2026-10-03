import type { ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";

/**
 * Shared email layout in the Nocturne light palette (email clients don't do
 * dark-mode tokens reliably, so emails use the light theme everywhere).
 * Sora/Plus Jakarta Sans are named first; clients without them fall back to
 * system sans fonts.
 */
export const EMAIL_COLORS = {
  page: "#F3F5FA",
  card: "#FFFFFF",
  border: "#DDE2EE",
  ink: "#141A2B",
  muted: "#4A5568",
  accent: "#4B5BD7",
  accentText: "#3F4FCC",
  onAccent: "#FFFFFF",
  raised: "#EEF1F8",
} as const;

const FONT = "'Plus Jakarta Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DISPLAY = "Sora, 'Plus Jakarta Sans', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export function EmailLayout({
  preview,
  eyebrow,
  title,
  children,
  footer,
}: {
  preview: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: EMAIL_COLORS.page, fontFamily: FONT, margin: 0, padding: "32px 12px" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Text style={{ fontFamily: DISPLAY, fontSize: "15px", fontWeight: 600, color: EMAIL_COLORS.ink, margin: "0 0 16px" }}>
            <span
              data-skip-in-text="true"
              style={{
                display: "inline-block",
                width: "24px",
                height: "24px",
                lineHeight: "24px",
                textAlign: "center",
                borderRadius: "6px",
                backgroundColor: EMAIL_COLORS.accent,
                color: EMAIL_COLORS.onAccent,
                marginRight: "8px",
                fontSize: "13px",
              }}
            >
              P
            </span>
            Peak Process Partners
          </Text>
          <Section
            style={{
              backgroundColor: EMAIL_COLORS.card,
              border: `1px solid ${EMAIL_COLORS.border}`,
              borderRadius: "14px",
              padding: "32px 28px",
            }}
          >
            {eyebrow && (
              <Text
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: EMAIL_COLORS.accentText,
                  margin: "0 0 8px",
                }}
              >
                {eyebrow}
              </Text>
            )}
            <Heading
              as="h1"
              style={{ fontFamily: DISPLAY, fontSize: "24px", lineHeight: "1.25", fontWeight: 600, color: EMAIL_COLORS.ink, margin: "0 0 16px" }}
            >
              {title}
            </Heading>
            {children}
          </Section>
          <Text style={{ fontSize: "12px", lineHeight: "1.5", color: EMAIL_COLORS.muted, margin: "16px 4px 0" }}>
            {footer ?? "You're receiving this because you applied for a role at Peak Process Partners."}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: "15px", lineHeight: "1.6", color: EMAIL_COLORS.ink, margin: "0 0 14px" }}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={{ fontSize: "13px", lineHeight: "1.55", color: EMAIL_COLORS.muted, margin: "0 0 12px" }}>{children}</Text>;
}

export function CtaButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: EMAIL_COLORS.accent,
        color: EMAIL_COLORS.onAccent,
        fontWeight: 700,
        fontSize: "15px",
        borderRadius: "10px",
        padding: "12px 20px",
        textDecoration: "none",
        display: "inline-block",
        margin: "6px 0 18px",
      }}
    >
      {children}
    </Button>
  );
}

/** A small label/value box, e.g. a reference number or interview time. */
export function Facts({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <Section style={{ backgroundColor: EMAIL_COLORS.raised, borderRadius: "10px", padding: "14px 18px", margin: "4px 0 18px" }}>
      {rows.map((r) => (
        <Text key={r.label} style={{ margin: "4px 0", fontSize: "14px", lineHeight: "1.5", color: EMAIL_COLORS.ink }}>
          <span style={{ color: EMAIL_COLORS.muted }}>{r.label}: </span>
          <strong>{r.value}</strong>
        </Text>
      ))}
    </Section>
  );
}

export function Divider() {
  return <Hr style={{ borderColor: EMAIL_COLORS.border, margin: "8px 0 16px" }} />;
}
