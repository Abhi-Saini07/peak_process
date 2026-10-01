import { NextResponse } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { jobSchema } from "@/lib/schemas/job.schema";
import { createJob } from "@/lib/server/jobRepository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid job data" }, { status: 400 });
  }

  const { id } = await createJob(parsed.data, auth.admin.id);
  return NextResponse.json({ id });
}
