import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { jobStatusSchema } from "@/lib/schemas/job.schema";
import { updateJobStatus } from "@/lib/server/jobRepository";

export const runtime = "nodejs";

const bodySchema = z.object({ status: jobStatusSchema });

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/jobs/[id]/status">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await updateJobStatus(id, parsed.data.status);
  if ("error" in result) return NextResponse.json(result, { status: 404 });
  return NextResponse.json(result);
}
