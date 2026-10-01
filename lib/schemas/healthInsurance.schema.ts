import { z } from "zod";

export const coverageTypeOptions = [
  { value: "self", label: "Self only" },
  { value: "self-spouse", label: "Self + Spouse" },
  { value: "self-family", label: "Self + Family" },
] as const;

export const dependentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
});

export const healthInsuranceSchema = z.object({
  coverageType: z.enum(["self", "self-spouse", "self-family"], {
    error: "Select a coverage type",
  }),
  dependents: z.array(dependentSchema).max(5, "Add up to 5 dependents").default([]),
  nomineeName: z.string().min(1, "Nominee name is required"),
  nomineeRelationship: z.string().min(1, "Nominee relationship is required"),
});

export type DependentData = z.infer<typeof dependentSchema>;
export type HealthInsuranceData = z.infer<typeof healthInsuranceSchema>;

export const healthInsuranceDefaults = {
  coverageType: undefined as unknown as HealthInsuranceData["coverageType"],
  dependents: [] as DependentData[],
  nomineeName: "",
  nomineeRelationship: "",
};
