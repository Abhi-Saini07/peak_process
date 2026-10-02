import { z } from "zod";
import { phoneSchema } from "./shared";
import { knockoutAnswersSchemaFor, type PublicKnockoutQuestion } from "@/lib/recruitment/knockouts";

export const educationLevelSchema = z.enum(["high_school", "diploma", "bachelors", "masters", "doctorate", "other"], {
  error: "Choose your highest education",
});

/**
 * The public job-application form. Deliberately does NOT collect Aadhaar,
 * PAN, bank details, or anything else from the onboarding step schemas —
 * that information belongs to employee onboarding after hiring, not an
 * initial job application (explicit in the brief).
 */
export const jobApplicationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.email("Enter a valid email address"),
  phone: phoneSchema,
  location: z.string().min(1, "Current location is required").max(150),
  experienceYears: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number("Enter years of experience").int().min(0).max(60),
  ),
  education: educationLevelSchema,
  coverLetter: z.string().max(4000).optional().or(z.literal("")),
  // Columns are VARCHAR(500).
  linkedinUrl: z.url("Enter a valid URL").max(500, "Keep the link under 500 characters").optional().or(z.literal("")),
  portfolioUrl: z.url("Enter a valid URL").max(500, "Keep the link under 500 characters").optional().or(z.literal("")),
});

export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;
/** react-hook-form must be typed with the schema's INPUT shape (pre-preprocess),
 *  not the output — zodResolver's generic follows z.input, not z.infer. */
export type JobApplicationFormInput = z.input<typeof jobApplicationSchema>;

export const jobApplicationDefaults = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  location: "",
  experienceYears: undefined as unknown as number,
  education: undefined as unknown as JobApplicationFormData["education"],
  coverLetter: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

/** The apply form for one job: the base fields plus a required Yes/No answer
 *  for each of the job's screening questions. Used by the form (zodResolver)
 *  and by POST /api/jobs/[id]/apply, built from the job's current questions. */
export function jobApplicationSchemaFor(knockouts: readonly PublicKnockoutQuestion[]) {
  return jobApplicationSchema.extend({
    knockoutAnswers: knockoutAnswersSchemaFor(knockouts),
    // A checkbox on the form; "true" when it arrives as multipart form data.
    consent: z.preprocess(
      (val) => val === true || val === "true" || val === "on",
      z.literal(true, { error: "Please agree to the privacy notice to apply." }),
    ),
  });
}

export type KnockoutAnswerValue = "yes" | "no";
export type JobApplicationWithKnockoutsInput = JobApplicationFormInput & {
  knockoutAnswers: Record<string, KnockoutAnswerValue>;
  /** A checkbox (boolean) on the form, a string in multipart data. */
  consent: unknown;
};
export type JobApplicationWithKnockoutsData = JobApplicationFormData & {
  knockoutAnswers: Record<string, KnockoutAnswerValue>;
  consent: true;
};

/** Hidden "company website" field on the apply form. People never see or fill
 *  it (aria-hidden, tabIndex -1, autoComplete off); bots that fill every input
 *  do, and the API then answers with a fake success and saves nothing. */
export const HONEYPOT_FIELD = "company_website";
