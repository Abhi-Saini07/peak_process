import { z } from "zod";

export const employmentTypeSchema = z.enum(["full_time", "part_time", "contract", "internship"]);
export const workModeSchema = z.enum(["onsite", "hybrid", "remote"]);
export const jobStatusSchema = z.enum(["draft", "published", "closed"]);

/** Empty string (an untouched number input) means "not specified", not zero. */
function optionalYears(max: number) {
  return z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0).max(max).optional(),
  );
}

function optionalAmount() {
  return z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0).optional(),
  );
}

export const jobSchema = z
  .object({
    title: z.string().min(1, "Job title is required").max(200),
    department: z.string().max(150).optional().or(z.literal("")),
    location: z.string().max(150).optional().or(z.literal("")),
    employmentType: employmentTypeSchema,
    workMode: workModeSchema,
    experienceMinYears: optionalYears(60),
    experienceMaxYears: optionalYears(60),
    salaryMin: optionalAmount(),
    salaryMax: optionalAmount(),
    salaryPublic: z.boolean().default(false),
    overview: z.string().max(4000).optional().or(z.literal("")),
    responsibilities: z.string().max(4000).optional().or(z.literal("")),
    requirements: z.string().max(4000).optional().or(z.literal("")),
    requiredSkills: z.array(z.string().min(1)).max(30).default([]),
    preferredSkills: z.array(z.string().min(1)).max(30).default([]),
    education: z.string().max(255).optional().or(z.literal("")),
    benefits: z.string().max(4000).optional().or(z.literal("")),
    deadline: z.string().optional().or(z.literal("")), // yyyy-mm-dd from <input type="date">
    status: jobStatusSchema.default("draft"),
  })
  .refine(
    (data) =>
      data.experienceMinYears === undefined ||
      data.experienceMaxYears === undefined ||
      data.experienceMinYears <= data.experienceMaxYears,
    { message: "Minimum experience can't exceed maximum experience", path: ["experienceMaxYears"] },
  )
  .refine((data) => data.salaryMin === undefined || data.salaryMax === undefined || data.salaryMin <= data.salaryMax, {
    message: "Minimum salary can't exceed maximum salary",
    path: ["salaryMax"],
  });

export type JobFormData = z.infer<typeof jobSchema>;
/** react-hook-form must be typed with the schema's INPUT shape (pre-preprocess/pre-default),
 *  not the output — zodResolver's generic follows z.input, not z.infer. */
export type JobFormInput = z.input<typeof jobSchema>;

export const jobFormDefaults: JobFormData = {
  title: "",
  department: "",
  location: "",
  employmentType: "full_time",
  workMode: "onsite",
  experienceMinYears: undefined,
  experienceMaxYears: undefined,
  salaryMin: undefined,
  salaryMax: undefined,
  salaryPublic: false,
  overview: "",
  responsibilities: "",
  requirements: "",
  requiredSkills: [],
  preferredSkills: [],
  education: "",
  benefits: "",
  deadline: "",
  status: "draft",
};
