/** Template ids used in EmailLog.template, with their timeline labels. */
export type EmailTemplate =
  | "application_received"
  | "rejection"
  | "interview_scheduled"
  | "interview_rescheduled"
  | "interview_cancelled"
  | "scheduling_invite"
  | "offer"
  | "onboarding_invite"
  | "onboarding_submitted";

export const EMAIL_TEMPLATE_LABEL: Record<EmailTemplate, string> = {
  application_received: "Application received",
  rejection: "Rejection",
  interview_scheduled: "Interview scheduled",
  interview_rescheduled: "Interview rescheduled",
  interview_cancelled: "Interview cancelled",
  scheduling_invite: "Scheduling link",
  offer: "Offer",
  onboarding_invite: "Onboarding invite",
  onboarding_submitted: "Onboarding submitted (to HR)",
};
