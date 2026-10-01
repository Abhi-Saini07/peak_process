import { z } from "zod";
import { genderSchema, phoneSchema } from "./shared";

export const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: genderSchema,
});

export const contactInfoSchema = z.object({
  personalEmail: z.email("Enter a valid email address"),
  phone: phoneSchema,
});

export const addressSchema = z.object({
  homeAddress: z.string().min(10, "Enter your full street address, city, state, and PIN"),
});

export const governmentIdsSchema = z.object({
  aadhaar: z
    .string()
    .regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar number"),
  pan: z
    .string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN, e.g. ABCDE1234F"),
  uan: z
    .string()
    .regex(/^\d{12}$/, "UAN must be 12 digits")
    .optional()
    .or(z.literal("")),
});

export const personalInfoSchema = z.object({
  basicInfo: basicInfoSchema,
  contactInfo: contactInfoSchema,
  address: addressSchema,
  governmentIds: governmentIdsSchema,
});

export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type ContactInfoData = z.infer<typeof contactInfoSchema>;
export type AddressData = z.infer<typeof addressSchema>;
export type GovernmentIdsData = z.infer<typeof governmentIdsSchema>;
export type PersonalInfoData = z.infer<typeof personalInfoSchema>;

export const personalInfoDefaults: PersonalInfoData = {
  basicInfo: { firstName: "", lastName: "", dateOfBirth: "", gender: undefined },
  contactInfo: { personalEmail: "", phone: "" },
  address: { homeAddress: "" },
  governmentIds: { aadhaar: "", pan: "", uan: "" },
};
