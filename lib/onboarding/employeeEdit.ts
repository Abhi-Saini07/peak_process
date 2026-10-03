import { z } from "zod";
import { genderSchema, optionalPhoneSchema } from "@/lib/schemas/shared";
import { referencesSchema } from "@/lib/schemas/references.schema";
import { emergencyContactSchema } from "@/lib/schemas/emergencyContact.schema";
import { healthInsuranceSchema } from "@/lib/schemas/healthInsurance.schema";

/**
 * What HR can change on a new hire's or employee's record, one section at a
 * time. The rules match the onboarding forms, except that personal details
 * only require a name and email, so HR can fix one field for someone who
 * hasn't finished onboarding. Pure: shared by the edit page and the API.
 */
export const EMPLOYEE_EDIT_SECTIONS = ["personal", "governmentIds", "references", "emergencyContact", "healthInsurance"] as const;
export type EmployeeEditSection = (typeof EMPLOYEE_EDIT_SECTIONS)[number];

export const EMPLOYEE_EDIT_SECTION_LABEL: Record<EmployeeEditSection, string> = {
  personal: "Personal information",
  governmentIds: "Government IDs",
  references: "References",
  emergencyContact: "Emergency contact",
  healthInsurance: "Health insurance",
};

const blankOr = <T extends z.ZodType>(schema: T) => z.union([z.literal(""), schema]);

export const personalEditSchema = z.object({
  basicInfo: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    dateOfBirth: blankOr(z.iso.date("Enter a valid date")),
    gender: genderSchema.or(z.literal("")),
  }),
  contactInfo: z.object({
    personalEmail: z.email("Enter a valid email address").max(255),
    phone: optionalPhoneSchema,
  }),
  address: z.object({
    homeAddress: blankOr(z.string().trim().min(10, "Enter the full street address, city, state, and PIN").max(500)),
  }),
});
export type PersonalEditInput = z.infer<typeof personalEditSchema>;

/** Government IDs are never sent to the browser in full: a blank field keeps the stored number. */
export const governmentIdsEditSchema = z
  .object({
    aadhaar: blankOr(z.string().regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar number")),
    pan: blankOr(z.string().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN, e.g. ABCDE1234F")),
    uan: blankOr(z.string().regex(/^\d{12}$/, "UAN must be 12 digits")),
  })
  .refine((v) => Boolean(v.aadhaar || v.pan || v.uan), { message: "Enter at least one new number.", path: ["aadhaar"] });
export type GovernmentIdsEditInput = z.infer<typeof governmentIdsEditSchema>;

export const EMPLOYEE_EDIT_SCHEMAS = {
  personal: personalEditSchema,
  governmentIds: governmentIdsEditSchema,
  references: referencesSchema,
  emergencyContact: emergencyContactSchema,
  healthInsurance: healthInsuranceSchema,
} as const satisfies Record<EmployeeEditSection, z.ZodType>;

export const employeeEditRequestSchema = z.object({
  section: z.enum(EMPLOYEE_EDIT_SECTIONS),
  data: z.unknown(),
});
