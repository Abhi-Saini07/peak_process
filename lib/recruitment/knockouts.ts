import { z } from "zod";

/**
 * Knockout (screening) questions: up to two Yes/No questions per job, each
 * with the answer that qualifies. A wrong or missing answer never rejects
 * anyone; it only sets JobApplication.knockoutFlagged so HR can look first.
 * Pure: shared by the job form, the apply form and the API routes.
 */

export const KNOCKOUT_MAX = 2;
export const KNOCKOUT_LABEL_MAX = 200;

export type KnockoutQuestion = { id: string; label: string; qualifyingAnswer: boolean };

/** What candidates see: never the qualifying answer. */
export type PublicKnockoutQuestion = { id: string; label: string };

/** Stored on the application: the question as it was when they applied. */
export type KnockoutAnswer = KnockoutQuestion & { answer: boolean | null };

export const knockoutQuestionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z
    .string()
    .trim()
    .min(1, "Write the question.")
    .max(KNOCKOUT_LABEL_MAX, `Keep questions under ${KNOCKOUT_LABEL_MAX} characters.`),
  qualifyingAnswer: z.boolean({ error: "Choose the answer that qualifies." }),
});

export const knockoutsSchema = z
  .array(knockoutQuestionSchema)
  .max(KNOCKOUT_MAX, `A job can have at most ${KNOCKOUT_MAX} screening questions.`)
  .refine((list) => new Set(list.map((q) => q.id)).size === list.length, "Screening questions must be unique.");

export function validateKnockouts(
  value: unknown,
): { ok: true; value: KnockoutQuestion[] } | { ok: false; error: string } {
  const parsed = knockoutsSchema.safeParse(value ?? []);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the screening questions." };
  return { ok: true, value: parsed.data };
}

/** Lenient read of the Job.knockouts JSON column: drops anything malformed. */
export function parseStoredKnockouts(value: unknown): KnockoutQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => knockoutQuestionSchema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data)
    .slice(0, KNOCKOUT_MAX);
}

/** Lenient read of the JobApplication.knockoutAnswers JSON column. */
export function parseStoredKnockoutAnswers(value: unknown): KnockoutAnswer[] {
  if (!Array.isArray(value)) return [];
  const schema = knockoutQuestionSchema.extend({ answer: z.boolean().nullable() });
  return value
    .map((item) => schema.safeParse(item))
    .filter((r) => r.success)
    .map((r) => r.data);
}

export function toPublicKnockouts(questions: readonly KnockoutQuestion[]): PublicKnockoutQuestion[] {
  return questions.map(({ id, label }) => ({ id, label }));
}

/** True when any question is unanswered or answered differently from its qualifying answer. */
export function computeKnockoutFlag(
  questions: readonly KnockoutQuestion[],
  answers: Readonly<Record<string, boolean | null | undefined>>,
): boolean {
  return questions.some((q) => {
    const answer = answers[q.id];
    return answer == null || answer !== q.qualifyingAnswer;
  });
}

/** Snapshot of each question with the candidate's answer, for storage. */
export function snapshotKnockoutAnswers(
  questions: readonly KnockoutQuestion[],
  answers: Readonly<Record<string, boolean | null | undefined>>,
): KnockoutAnswer[] {
  return questions.map((q) => ({ ...q, answer: answers[q.id] ?? null }));
}

export function isQualifyingAnswer(item: KnockoutAnswer): boolean {
  return item.answer != null && item.answer === item.qualifyingAnswer;
}

/** Apply-form field for the questions of one job: each needs "yes" or "no". */
export function knockoutAnswersSchemaFor(questions: readonly PublicKnockoutQuestion[]) {
  return z.object(
    Object.fromEntries(
      questions.map((q) => [q.id, z.enum(["yes", "no"], { error: "Answer this question." })]),
    ) as Record<string, z.ZodEnum<{ yes: "yes"; no: "no" }>>,
  );
}

/** "yes"/"no" form values → booleans; anything else is left out (counts as unanswered). */
export function knockoutAnswersToBooleans(values: Readonly<Record<string, unknown>> | undefined): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(values ?? {})) {
    if (value === "yes") result[id] = true;
    else if (value === "no") result[id] = false;
  }
  return result;
}
