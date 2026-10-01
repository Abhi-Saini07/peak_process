import { z } from "zod";

export const welcomeSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
});

export type WelcomeData = z.infer<typeof welcomeSchema>;

export const welcomeDefaults: Partial<WelcomeData> = {
  fullName: "",
};
