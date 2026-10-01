import { z } from "zod";
import { phoneSchema } from "./shared";

export const educationLevelSchema = z.enum(["high_school", "diploma", "bachelors", "masters", "doctorate", "other"]);

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
  linkedinUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
  portfolioUrl: z.url("Enter a valid URL").optional().or(z.literal("")),
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
