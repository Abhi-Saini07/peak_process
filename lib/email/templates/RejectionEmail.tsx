import { EmailLayout, Muted, P } from "./Layout";

/** Deliberately generic: never says why (the reject reason stays internal). */
export function RejectionEmail({ firstName, jobTitle }: { firstName: string; jobTitle: string }) {
  return (
    <EmailLayout preview={`An update on your application for ${jobTitle}`} eyebrow="Application update" title={`Thank you, ${firstName}.`}>
      <P>Thank you for your interest in the <strong>{jobTitle}</strong> role and for the time you put into your application.</P>
      <P>After careful consideration, we&apos;ve decided not to move forward with your application at this time. This was not an easy decision.</P>
      <P>We&apos;d be glad to see you apply for future openings that match your experience.</P>
      <Muted>We wish you every success in your search.</Muted>
    </EmailLayout>
  );
}
