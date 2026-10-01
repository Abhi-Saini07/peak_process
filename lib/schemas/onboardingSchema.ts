import { z } from "zod";
import { welcomeSchema } from "./welcome.schema";
import { personalInfoSchema } from "./personalInfo.schema";
import { referencesSchema } from "./references.schema";
import { emergencyContactSchema } from "./emergencyContact.schema";
import { healthInsuranceSchema } from "./healthInsurance.schema";
import { documentsSchema } from "./documents.schema";

export const onboardingSchema = z.object({
  welcome: welcomeSchema,
  personalInfo: personalInfoSchema,
  references: referencesSchema,
  emergencyContact: emergencyContactSchema,
  healthInsurance: healthInsuranceSchema,
  documents: documentsSchema,
});

export type OnboardingData = z.infer<typeof onboardingSchema>;

export {
  welcomeSchema,
  personalInfoSchema,
  referencesSchema,
  emergencyContactSchema,
  healthInsuranceSchema,
  documentsSchema,
};
