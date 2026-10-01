import { NextResponse, type NextRequest } from "next/server";
import { jobApplicationSchema } from "@/lib/schemas/application.schema";
import { createApplication } from "@/lib/server/applicationRepository";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]/apply">) {
  const { id } = await ctx.params;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = jobApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your application details." },
      { status: 400 },
    );
  }

  const resumeFile = formData.get("resume");
  if (!(resumeFile instanceof File) || resumeFile.size === 0) {
    return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
  }
  const otherFile = formData.get("other");

  const result = await createApplication({
    jobId: id,
    data: parsed.data,
    resumeFile,
    otherFile: otherFile instanceof File && otherFile.size > 0 ? otherFile : null,
  });

  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
