import { CtaButton, EmailLayout, Muted, P } from "./Layout";

export function SchedulingInviteEmail({
  firstName,
  jobTitle,
  durationMinutes,
  modeLabel,
  link,
  windowLabel,
}: {
  firstName: string;
  jobTitle: string;
  durationMinutes: number;
  modeLabel: string;
  link: string;
  windowLabel: string;
}) {
  return (
    <EmailLayout preview={`Pick a time for your ${jobTitle} interview`} eyebrow="Interview" title={`Let's find a time, ${firstName}.`}>
      <P>
        We&apos;d like to invite you to a {durationMinutes}-minute {modeLabel.toLowerCase()} interview for <strong>{jobTitle}</strong>.
        Choose a time that suits you; the times are shown in your own timezone.
      </P>
      <CtaButton href={link}>Choose a time</CtaButton>
      <Muted>Times are available {windowLabel}. You can come back to the same link to reschedule or cancel.</Muted>
    </EmailLayout>
  );
}
