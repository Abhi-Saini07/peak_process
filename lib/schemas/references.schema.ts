import { z } from "zod";
import { phoneSchema } from "./shared";

export const referenceEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  company: z.string().min(1, "Company is required"),
  email: z.email("Enter a valid email address"),
  phone: phoneSchema,
});

export const referencesSchema = z.object({
  primaryReference: referenceEntrySchema,
  secondaryReference: referenceEntrySchema,
});

export type ReferenceEntryData = z.infer<typeof referenceEntrySchema>;
export type ReferencesData = z.infer<typeof referencesSchema>;

const emptyReference: ReferenceEntryData = {
  name: "",
  relationship: "",
  company: "",
  email: "",
  phone: "",
};

export const referencesDefaults: ReferencesData = {
  primaryReference: { ...emptyReference },
  secondaryReference: { ...emptyReference },
};
