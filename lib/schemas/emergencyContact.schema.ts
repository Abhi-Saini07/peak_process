import { z } from "zod";
import { optionalPhoneSchema, phoneSchema } from "./shared";

export const emergencyContactSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    primaryPhone: phoneSchema,
    secondaryPhone: optionalPhoneSchema,
    sameAsHomeAddress: z.boolean(),
    address: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => data.sameAsHomeAddress || (data.address && data.address.trim().length >= 10),
    {
      message: "Enter an address, or select “same as my address”",
      path: ["address"],
    },
  );

export type EmergencyContactData = z.infer<typeof emergencyContactSchema>;

export const emergencyContactDefaults = {
  name: "",
  relationship: "",
  primaryPhone: "",
  secondaryPhone: "",
  sameAsHomeAddress: false,
  address: "",
};
