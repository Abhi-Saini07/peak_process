import { CtaButton, EmailLayout, Muted, P } from "./Layout";

export function OnboardingInviteEmail({ firstName, jobTitle, link, expiresOn }: { firstName: string; jobTitle: string | null; link: string; expiresOn: string }) {
  return (
    <EmailLayout
      preview="Complete your onboarding with Peak Process Partners"
      eyebrow="Welcome aboard"
      title={`Welcome to the team, ${firstName}!`}
      footer="You're receiving this because you're joining Peak Process Partners."
    >
      <P>
        We&apos;re excited to have you join{jobTitle ? <> as <strong>{jobTitle}</strong></> : null}. Before your first day, please
        complete your onboarding: personal details, references, an emergency contact, health insurance and a few documents.
      </P>
      <CtaButton href={link}>Start onboarding</CtaButton>
      <Muted>
        This link is personal, works once on the browser you open it in, and expires on {expiresOn}. Your progress saves as you go, so
        you can finish later on the same browser.
      </Muted>
    </EmailLayout>
  );
}
