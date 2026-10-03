import { EmailLayout, Facts, Muted, P } from "./Layout";

export function OfferEmail({
  firstName,
  jobTitle,
  salary,
  startDate,
  expiresOn,
  note,
}: {
  firstName: string;
  jobTitle: string;
  salary: string;
  startDate: string;
  expiresOn: string;
  note: string;
}) {
  return (
    <EmailLayout preview={`Your offer for ${jobTitle}`} eyebrow="Job offer" title={`Congratulations, ${firstName}!`}>
      <P>We&apos;re delighted to offer you the <strong>{jobTitle}</strong> role at Peak Process Partners.</P>
      <Facts
        rows={[
          { label: "Salary", value: `${salary} per year` },
          { label: "Start date", value: startDate },
          { label: "Please reply by", value: expiresOn },
        ]}
      />
      {note && <P>{note}</P>}
      <Muted>Reply to this email to accept or ask any questions. Once you accept, we&apos;ll send you a link to complete your onboarding.</Muted>
    </EmailLayout>
  );
}
