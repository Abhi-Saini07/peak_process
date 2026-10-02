import type { Metadata } from "next";
import { NocturneCareersFrame } from "@/components/nocturne/recruitment/NocturneCareersFrame";
import { BackLink, CareersBand, careersContainer, pageTitleClass, panelClass, panelHeadingClass } from "@/components/nocturne/recruitment/careersUi";
import { PRIVACY_CONSENT_VERSION } from "@/lib/recruitment/consent";
import { ORGANIZATION_NAME } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: `Privacy notice for applicants | ${ORGANIZATION_NAME}`,
  description: `How ${ORGANIZATION_NAME} handles the details you send with a job application.`,
};

/** PLACEHOLDER: replace this copy with the legally reviewed notice, then bump
 *  PRIVACY_CONSENT_VERSION in lib/recruitment/consent.ts. */
const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "What we collect",
    body: [
      "The details you enter on the application form: your name, email address, phone number, location, years of experience and education, plus any cover letter and LinkedIn or portfolio links.",
      "The files you upload (your resume and an optional additional document), and your answers to any screening questions.",
    ],
  },
  {
    heading: "Why we use it",
    body: [
      "To review your application for the role you applied to and to contact you about it. Your details are seen only by our recruitment team.",
    ],
  },
  {
    heading: "How long we keep it, and your choices",
    body: [
      "This part of the notice is still being written. Until it is published, contact our recruitment team to ask what we hold about you or to have it deleted.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <NocturneCareersFrame>
      <CareersBand>
        <BackLink href="/jobs">Back to open roles</BackLink>
        <p className="nocturne-type-eyebrow mt-6 text-nocturne-accent-text">Privacy</p>
        <h1 className={cn(pageTitleClass, "mt-3")}>Privacy notice for applicants</h1>
        <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-nocturne-ink-muted">
          Version <span className="nocturne-mono text-nocturne-ink">{PRIVACY_CONSENT_VERSION}</span> · Placeholder text, to
          be replaced with the final notice.
        </p>
      </CareersBand>
      <main className={`${careersContainer} pt-6 pb-16 sm:pb-24`}>
        <div className={cn(panelClass, "flex max-w-3xl flex-col gap-7 p-5 sm:p-7")}>
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className={panelHeadingClass}>{section.heading}</h2>
              {section.body.map((p) => (
                <p key={p} className="mt-2.5 text-[0.9375rem] leading-relaxed text-nocturne-ink">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </NocturneCareersFrame>
  );
}
