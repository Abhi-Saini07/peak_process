import "server-only";
import type { ReactElement } from "react";
import { render, toPlainText } from "@react-email/components";
import { Resend } from "resend";

/**
 * The one way the app sends email. Production uses Resend (RESEND_API_KEY);
 * without a key the rendered email is printed to the server log instead, so
 * development and previews need no email account. The transport can be
 * swapped (tests pass their own).
 *
 * sendEmail never throws: an email is a side effect and must never fail the
 * action that triggered it. Callers get a status to record.
 */

export const DEFAULT_EMAIL_FROM = "Peak Process Partners <onboarding@resend.dev>";

export type OutgoingEmail = { from: string; to: string[]; subject: string; html: string; text: string };

export interface EmailTransport {
  name: "resend" | "console" | string;
  send(email: OutgoingEmail): Promise<{ id: string | null }>;
}

export type SendResult =
  | { status: "sent"; id: string | null }
  | { status: "logged" }
  | { status: "failed"; error: string };

export function resendTransport(apiKey: string): EmailTransport {
  const client = new Resend(apiKey);
  return {
    name: "resend",
    async send(email) {
      const { data, error } = await client.emails.send({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      if (error) throw new Error(error.message);
      return { id: data?.id ?? null };
    },
  };
}

/** Dev mode: print the email instead of sending it. */
export const consoleTransport: EmailTransport = {
  name: "console",
  async send(email) {
    console.info(
      [
        "[email:dev] No RESEND_API_KEY set; this email was not sent.",
        `  From:    ${email.from}`,
        `  To:      ${email.to.join(", ")}`,
        `  Subject: ${email.subject}`,
        "",
        email.text,
      ].join("\n"),
    );
    return { id: null };
  },
};

export function defaultTransport(): EmailTransport {
  const key = process.env.RESEND_API_KEY?.trim();
  return key ? resendTransport(key) : consoleTransport;
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM;
}

export async function sendEmail(
  { to, subject, react }: { to: string | string[]; subject: string; react: ReactElement },
  transport: EmailTransport = defaultTransport(),
): Promise<SendResult> {
  const recipients = (Array.isArray(to) ? to : [to]).map((t) => t.trim()).filter(Boolean);
  if (recipients.length === 0) return { status: "failed", error: "No recipient" };
  try {
    const html = await render(react);
    const text = toPlainText(html, { selectors: [{ selector: "[data-skip-in-text=true]", format: "skip" }] });
    const { id } = await transport.send({ from: emailFrom(), to: recipients, subject, html, text });
    return transport.name === "console" ? { status: "logged" } : { status: "sent", id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email] Sending "${subject}" to ${recipients.join(", ")} failed: ${message}`);
    return { status: "failed", error: message.slice(0, 500) };
  }
}
