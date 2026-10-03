import { randomUUID } from "crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { HONEYPOT_FIELD, jobApplicationSchemaFor } from "@/lib/schemas/application.schema";
import { createApplication } from "@/lib/server/applicationRepository";
import { getOpenJobKnockouts } from "@/lib/server/jobRepository";
import { applyRateLimiter, clientIp } from "@/lib/server/rateLimit";
import { knockoutAnswersToBooleans, toPublicKnockouts } from "@/lib/recruitment/knockouts";
import { MAGIC_BYTES_NEEDED, validateDocument } from "@/lib/recruitment/uploads";
import { PRIVACY_CONSENT_VERSION } from "@/lib/recruitment/consent";
import { applicationReferenceFromId } from "@/lib/recruitment/reference";
import { notifyApplicationReceived } from "@/lib/server/notifications";

export const runtime = "nodejs";

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || value === "") return {};
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function checkDocument(file: File, what: string): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, MAGIC_BYTES_NEEDED).arrayBuffer());
  const result = validateDocument({ name: file.name, type: file.type, size: file.size }, head, what);
  return result.ok ? null : result.error;
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/jobs/[id]/apply">) {
  const limit = applyRateLimiter.check(clientIp(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many applications from your network. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { id } = await ctx.params;
  const formData = await request.formData().catch(() => null);
  if (!formData) return badRequest("Invalid form submission.");

  // Honeypot filled: answer like a success so the bot learns nothing, and store nothing.
  const honeypot = formData.get(HONEYPOT_FIELD);
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ applicationId: randomUUID(), reference: applicationReferenceFromId(randomUUID()) });
  }

  const knockoutQuestions = await getOpenJobKnockouts(id);
  if (!knockoutQuestions) return badRequest("This position is no longer accepting applications.");

  const raw = { ...Object.fromEntries(formData.entries()), knockoutAnswers: parseJsonField(formData.get("knockoutAnswers")) };
  const parsed = jobApplicationSchemaFor(toPublicKnockouts(knockoutQuestions)).safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return badRequest(
      issue?.path[0] === "knockoutAnswers"
        ? "Please answer every screening question."
        : (issue?.message ?? "Please check your application details."),
    );
  }

  const resumeFile = formData.get("resume");
  if (!(resumeFile instanceof File) || resumeFile.size === 0) return badRequest("Please attach your resume.");
  const resumeError = await checkDocument(resumeFile, "Your resume");
  if (resumeError) return badRequest(resumeError);

  const other = formData.get("other");
  const otherFile = other instanceof File && other.size > 0 ? other : null;
  if (otherFile) {
    const otherError = await checkDocument(otherFile, "The additional document");
    if (otherError) return badRequest(otherError);
  }

  // Consent must be true to get here; it is stored as a timestamp plus the notice version.
  let result: Awaited<ReturnType<typeof createApplication>>;
  try {
    result = await createApplication({
      jobId: id,
      data: parsed.data,
      resumeFile,
      otherFile,
      knockoutQuestions,
      knockoutAnswers: knockoutAnswersToBooleans(parsed.data.knockoutAnswers),
      consentVersion: PRIVACY_CONSENT_VERSION,
    });
  } catch (error) {
    // Uploaded files were already removed by createApplication.
    console.error("Saving a job application failed", error);
    return NextResponse.json(
      { error: "We couldn't save your application just now. Please try again in a few minutes." },
      { status: 500 },
    );
  }

  if ("error" in result) return badRequest(result.error);
  // The confirmation email goes out after the response; it can't fail the application.
  const applicationId = result.applicationId;
  after(() => notifyApplicationReceived(applicationId));
  return NextResponse.json(result);
}
