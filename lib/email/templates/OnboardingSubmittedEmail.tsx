import { CtaButton, EmailLayout, Facts, P } from "./Layout";

export function OnboardingSubmittedEmail({
  employeeName,
  reference,
  jobTitle,
  link,
}: {
  employeeName: string;
  reference: string;
  jobTitle: string | null;
  link: string;
}) {
  return (
    <EmailLayout
      preview={`${employeeName} submitted their onboarding`}
      eyebrow="Onboarding submitted"
      title={`${employeeName} has finished onboarding.`}
      footer="Sent to the HR team by Peak Process Partners."
    >
      <P>All onboarding steps are complete and submitted.</P>
      <Facts rows={[{ label: "Reference", value: reference }, ...(jobTitle ? [{ label: "Role", value: jobTitle }] : [])]} />
      <CtaButton href={link}>Open the employee record</CtaButton>
    </EmailLayout>
  );
}
