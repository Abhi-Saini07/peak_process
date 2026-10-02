import { NextResponse, type NextRequest } from "next/server";
import { jobApplicationSchemaFor } from "@/lib/schemas/application.schema";
import { createApplication } from "@/lib/server/applicationRepository";
import { getOpenJobKnockouts } from "@/lib/server/jobRepository";
import { knockoutAnswersToBooleans, toPublicKnockouts } from "@/lib/recruitment/knockouts";

export const runtime = "nodejs";

function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value === "") return {};
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]/apply">) {
  const { id } = await ctx.params;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const knockoutQuestions = await getOpenJobKnockouts(id);
  if (!knockoutQuestions) {
    return NextResponse.json({ error: "This position is no longer accepting applications." }, { status: 400 });
  }

  const raw = { ...Object.fromEntries(formData.entries()), knockoutAnswers: parseJsonField(formData.get("knockoutAnswers")) };
  const parsed = jobApplicationSchemaFor(toPublicKnockouts(knockoutQuestions)).safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const error =
      issue?.path[0] === "knockoutAnswers"
        ? "Please answer every screening question."
        : (issue?.message ?? "Please check your application details.");
    return NextResponse.json({ error }, { status: 400 });
  }

  const resumeFile = formData.get("resume");
  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
  }
  const otherFile = formData.get("other");

  const { knockoutAnswers, ...data } = parsed.data;
  const result = await createApplication({
    jobId: id,
    data,
    resumeFile,
    otherFile: otherFile instanceof File && otherFile.size > 0 ? otherFile : null,
    knockoutQuestions,
    knockoutAnswers: knockoutAnswersToBooleans(knockoutAnswers),
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
