import { EmailLayout, Facts, Muted, P } from "./Layout";

export function ApplicationReceivedEmail({ firstName, jobTitle, reference }: { firstName: string; jobTitle: string; reference: string }) {
  return (
    <EmailLayout preview={`We received your application for ${jobTitle}`} eyebrow="Application received" title={`Thanks for applying, ${firstName}.`}>
      <P>We&apos;ve received your application for <strong>{jobTitle}</strong>. Our recruitment team will review it and get back to you if there are next steps.</P>
      <Facts rows={[{ label: "Your reference", value: reference }]} />
      <Muted>Please keep this reference handy if you contact us about your application.</Muted>
    </EmailLayout>
  );
}
