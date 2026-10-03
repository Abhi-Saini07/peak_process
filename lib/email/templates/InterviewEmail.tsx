import { CtaButton, EmailLayout, Facts, Muted, P } from "./Layout";

export type InterviewEmailKind = "scheduled" | "rescheduled" | "cancelled";

export type InterviewEmailProps = {
  kind: InterviewEmailKind;
  recipientName: string;
  /** "candidate": the person interviewing; "interviewer": the HR team member. */
  audience: "candidate" | "interviewer";
  candidateName: string;
  jobTitle: string;
  /** Pre-formatted in the right timezone, e.g. "Tue, 7 Oct 2026, 10:30 IST". */
  when: string;
  durationMinutes: number;
  modeLabel: string;
  meetingUrl?: string | null;
  location?: string | null;
  manageUrl?: string | null;
  icsUrl?: string | null;
};

const TITLES: Record<InterviewEmailKind, string> = {
  scheduled: "Your interview is booked",
  rescheduled: "Your interview has moved",
  cancelled: "Your interview is cancelled",
};

export function InterviewEmail(p: InterviewEmailProps) {
  const forCandidate = p.audience === "candidate";
  const title = forCandidate ? TITLES[p.kind] : `Interview ${p.kind}: ${p.candidateName}`;
  const rows = [
    { label: "Role", value: p.jobTitle },
    ...(forCandidate ? [] : [{ label: "Candidate", value: p.candidateName }]),
    { label: p.kind === "cancelled" ? "Was" : "When", value: p.when },
    { label: "Length", value: `${p.durationMinutes} minutes` },
    { label: "Format", value: p.modeLabel },
    ...(p.kind !== "cancelled" && p.location ? [{ label: "Where", value: p.location }] : []),
  ];
  return (
    <EmailLayout
      preview={`${title} · ${p.when}`}
      eyebrow={p.kind === "cancelled" ? "Interview cancelled" : "Interview"}
      title={title}
      footer={forCandidate ? undefined : "Sent to you as the interviewer by Peak Process Partners recruitment."}
    >
      <P>Hi {p.recipientName},</P>
      {p.kind === "cancelled" ? (
        <P>The interview below has been cancelled. {forCandidate ? "We'll be in touch about next steps." : ""}</P>
      ) : (
        <P>{p.kind === "rescheduled" ? "The interview has a new time:" : "Here are the details:"}</P>
      )}
      <Facts rows={rows} />
      {p.kind !== "cancelled" && p.meetingUrl && <CtaButton href={p.meetingUrl}>Join the meeting</CtaButton>}
      {forCandidate && p.manageUrl && p.kind !== "cancelled" && (
        <Muted>
          Need a different time? You can reschedule or cancel here: <a href={p.manageUrl}>{p.manageUrl}</a>
        </Muted>
      )}
      {p.icsUrl && p.kind !== "cancelled" && (
        <Muted>
          <a href={p.icsUrl}>Add it to your calendar (.ics)</a>
        </Muted>
      )}
    </EmailLayout>
  );
}
