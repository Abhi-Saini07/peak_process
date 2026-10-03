import "server-only";
import type { ReactElement } from "react";
import { prisma } from "@/lib/db/prisma";
import { defaultTransport, sendEmail, type EmailTransport, type SendResult } from "@/lib/email/send";
import { applicationReferenceFromId } from "@/lib/recruitment/reference";
import { formatMoney, parseOfferDetails } from "@/lib/recruitment/offers";
import { absoluteUrl } from "@/lib/site";
import { EMAIL_TEMPLATE_LABEL, type EmailTemplate } from "@/lib/email/templates/labels";
import { ApplicationReceivedEmail } from "@/lib/email/templates/ApplicationReceivedEmail";
import { RejectionEmail } from "@/lib/email/templates/RejectionEmail";
import { OfferEmail } from "@/lib/email/templates/OfferEmail";
import { OnboardingInviteEmail } from "@/lib/email/templates/OnboardingInviteEmail";
import { OnboardingSubmittedEmail } from "@/lib/email/templates/OnboardingSubmittedEmail";
import { InterviewEmail, type InterviewEmailKind } from "@/lib/email/templates/InterviewEmail";
import { SchedulingInviteEmail } from "@/lib/email/templates/SchedulingInviteEmail";
import { interviewModeLabel } from "@/lib/recruitment/interviews";
import { formatDayLabel, formatInTimeZone, officeTimeZone } from "@/lib/recruitment/timezones";
import type { InterviewSnapshot } from "@/lib/server/interviewRepository";

/**
 * Transactional emails for the recruitment and onboarding flows. Every
 * function here is best-effort: it never throws, so the action that called it
 * (an application, a rejection, a hire...) always succeeds on its own. Each
 * attempt, sent or failed, is written to EmailLog, which feeds the
 * application's activity timeline. Failures are also logged with a
 * "[notify:<template>]" prefix.
 */

export { EMAIL_TEMPLATE_LABEL, type EmailTemplate };

let transportOverride: EmailTransport | null = null;
/** Tests swap the transport (e.g. one that fails, or records). */
export function setNotificationTransport(transport: EmailTransport | null): void {
  transportOverride = transport;
}

export function formatEmailDate(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** HR inbox for "onboarding submitted": HR_NOTIFICATIONS_EMAIL, else ADMIN_EMAILS. */
export function hrRecipients(): string[] {
  const raw = process.env.HR_NOTIFICATIONS_EMAIL?.trim() || process.env.ADMIN_EMAILS || "";
  return raw.split(",").map((e) => e.trim()).filter(Boolean);
}

type Delivery = {
  template: EmailTemplate;
  to: string | string[];
  subject: string;
  react: ReactElement;
  applicationId?: string | null;
  employeeId?: string | null;
};

/** Sends one email and records the attempt. Never throws. */
export async function deliver(d: Delivery): Promise<SendResult> {
  const result = await sendEmail({ to: d.to, subject: d.subject, react: d.react }, transportOverride ?? defaultTransport());
  try {
    await prisma.emailLog.create({
      data: {
        applicationId: d.applicationId ?? null,
        employeeId: d.employeeId ?? null,
        template: d.template,
        recipient: (Array.isArray(d.to) ? d.to.join(", ") : d.to).slice(0, 255),
        subject: d.subject.slice(0, 255),
        status: result.status,
        providerMessageId: result.status === "sent" ? result.id : null,
        error: result.status === "failed" ? result.error.slice(0, 500) : null,
      },
    });
  } catch (error) {
    console.error(`[notify:${d.template}] Couldn't record the email attempt`, error);
  }
  return result;
}

/** Runs a notification, swallowing and logging anything unexpected. */
export async function safely(context: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(`[notify:${context}] Notification failed; the main action was not affected.`, error);
  }
}

async function loadApplication(applicationId: string) {
  return prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { candidate: true, job: { select: { title: true } } },
  });
}

export function notifyApplicationReceived(applicationId: string): Promise<void> {
  return safely("application_received", async () => {
    const app = await loadApplication(applicationId);
    if (!app) return;
    await deliver({
      template: "application_received",
      applicationId,
      to: app.candidate.email,
      subject: `We received your application for ${app.job.title}`,
      react: (
        <ApplicationReceivedEmail
          firstName={app.candidate.firstName}
          jobTitle={app.job.title}
          reference={applicationReferenceFromId(app.id)}
        />
      ),
    });
  });
}

/** Never mentions the reason: that stays internal. */
export function notifyRejection(applicationId: string): Promise<void> {
  return safely("rejection", async () => {
    const app = await loadApplication(applicationId);
    if (!app) return;
    await deliver({
      template: "rejection",
      applicationId,
      to: app.candidate.email,
      subject: `Your application for ${app.job.title}`,
      react: <RejectionEmail firstName={app.candidate.firstName} jobTitle={app.job.title} />,
    });
  });
}

export function notifyOffer(applicationId: string): Promise<void> {
  return safely("offer", async () => {
    const app = await loadApplication(applicationId);
    const offer = app ? parseOfferDetails(app.offerDetails) : null;
    if (!app || !offer) return;
    await deliver({
      template: "offer",
      applicationId,
      to: app.candidate.email,
      subject: `Your offer for ${app.job.title}`,
      react: (
        <OfferEmail
          firstName={app.candidate.firstName}
          jobTitle={app.job.title}
          salary={formatMoney(offer.salary, offer.currency)}
          startDate={formatEmailDate(offer.startDate)}
          expiresOn={formatEmailDate(offer.expiresOn)}
          note={offer.note}
        />
      ),
    });
  });
}

export function notifyOnboardingInvite(employeeId: string, link: string, expiresAt: Date): Promise<void> {
  return safely("onboarding_invite", async () => {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { personalInformation: true, sourceApplication: { include: { job: { select: { title: true } }, candidate: true } } },
    });
    if (!employee) return;
    const email = employee.personalInformation?.personalEmail ?? employee.sourceApplication?.candidate.email;
    if (!email) return;
    const firstName = employee.personalInformation?.firstName ?? employee.fullName?.split(" ")[0] ?? "there";
    await deliver({
      template: "onboarding_invite",
      applicationId: employee.sourceApplicationId,
      employeeId,
      to: email,
      subject: "Complete your onboarding with Peak Process Partners",
      react: (
        <OnboardingInviteEmail
          firstName={firstName}
          jobTitle={employee.sourceApplication?.job.title ?? null}
          link={link}
          expiresOn={formatEmailDate(expiresAt.toISOString())}
        />
      ),
    });
  });
}

export function notifyOnboardingSubmitted(employeeId: string): Promise<void> {
  return safely("onboarding_submitted", async () => {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { sourceApplication: { include: { job: { select: { title: true } } } } },
    });
    const to = hrRecipients();
    if (!employee || to.length === 0) return;
    const name = employee.fullName ?? "A new hire";
    await deliver({
      template: "onboarding_submitted",
      applicationId: employee.sourceApplicationId,
      employeeId,
      to,
      subject: `${name} submitted their onboarding`,
      react: (
        <OnboardingSubmittedEmail
          employeeName={name}
          reference={employee.submissionReference ?? "—"}
          jobTitle={employee.sourceApplication?.job.title ?? null}
          link={absoluteUrl(`/admin/employees/${employeeId}`)}
        />
      ),
    });
  });
}

/**
 * Interview booked / moved / cancelled: one email to the candidate and one to
 * the interviewer, times in the office timezone. `scheduleToken` is the
 * candidate's link (only known when they booked through it): it adds the
 * "reschedule or cancel" and .ics links to the candidate's email.
 */
export function notifyInterview(
  interviewId: string,
  kind: InterviewEmailKind,
  options: {
    scheduleToken?: string | null;
    notifyCandidate?: boolean;
    notifyInterviewer?: boolean;
    /** Send the interviewer email to this admin instead (e.g. the one taken off the interview). */
    interviewerAdminId?: string;
    /** Describe the interview as it was (e.g. the old time, for a cancellation after an edit). */
    asWas?: InterviewSnapshot;
  } = {},
): Promise<void> {
  return safely(`interview_${kind}`, async () => {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewer: { select: { fullName: true, email: true } },
        application: { include: { candidate: true, job: { select: { title: true } } } },
      },
    });
    if (!interview) return;
    const { candidate, job } = interview.application;
    const candidateName = `${candidate.firstName} ${candidate.lastName}`.trim();
    const details = options.asWas ?? interview;
    const common = {
      kind,
      candidateName,
      jobTitle: job.title,
      when: formatInTimeZone(details.scheduledAt, officeTimeZone()),
      durationMinutes: details.durationMinutes,
      modeLabel: interviewModeLabel(details.mode),
      meetingUrl: details.meetingUrl,
      location: details.location,
    };
    const template: EmailTemplate = `interview_${kind}`;
    const token = options.scheduleToken;
    if (options.notifyCandidate !== false) {
      await deliver({
        template,
        applicationId: interview.applicationId,
        to: candidate.email,
        subject: kind === "cancelled" ? `Interview cancelled: ${job.title}` : `Your ${job.title} interview: ${common.when}`,
        react: (
          <InterviewEmail
            {...common}
            audience="candidate"
            recipientName={candidate.firstName}
            manageUrl={token ? absoluteUrl(`/schedule/${token}`) : null}
            icsUrl={token ? absoluteUrl(`/api/schedule/${token}/ics`) : null}
          />
        ),
      });
    }
    const interviewer = options.interviewerAdminId
      ? await prisma.adminUser.findUnique({ where: { id: options.interviewerAdminId }, select: { fullName: true, email: true } })
      : interview.interviewer;
    if (options.notifyInterviewer !== false && interviewer) {
      await deliver({
        template,
        applicationId: interview.applicationId,
        to: interviewer.email,
        subject: `Interview ${kind}: ${candidateName} (${job.title})`,
        react: <InterviewEmail {...common} audience="interviewer" recipientName={interviewer.fullName.split(" ")[0] || "there"} />,
      });
    }
  });
}

/** Emails the candidate their self-scheduling link. The raw token exists only here and in the email. */
export function notifySchedulingInvite(inviteId: string, token: string): Promise<void> {
  return safely("scheduling_invite", async () => {
    const invite = await prisma.scheduleInvite.findUnique({
      where: { id: inviteId },
      include: { application: { include: { candidate: true, job: { select: { title: true } } } } },
    });
    if (!invite) return;
    const { candidate, job } = invite.application;
    const tz = officeTimeZone();
    const day = (d: Date) => formatDayLabel(d, tz, "short");
    const lastDay = new Date(invite.windowEnd.getTime() - 1);
    await deliver({
      template: "scheduling_invite",
      applicationId: invite.applicationId,
      to: candidate.email,
      subject: `Choose a time for your ${job.title} interview`,
      react: (
        <SchedulingInviteEmail
          firstName={candidate.firstName}
          jobTitle={job.title}
          durationMinutes={invite.durationMinutes}
          modeLabel={interviewModeLabel(invite.mode)}
          link={absoluteUrl(`/schedule/${token}`)}
          windowLabel={`from ${day(invite.windowStart)} to ${day(lastDay)}`}
        />
      ),
    });
  });
}
