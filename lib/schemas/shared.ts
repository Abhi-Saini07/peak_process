import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number");

export const optionalPhoneSchema = z
  .string()
  .regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const genderOptions = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
] as const;

export const genderSchema = z
  .enum(["female", "male", "non-binary", "prefer-not-to-say"])
  .optional();
