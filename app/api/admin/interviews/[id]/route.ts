import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { updateInterviewStatus } from "@/lib/server/interviewRepository";
import { interviewStatusUpdateSchema } from "@/lib/recruitment/interviews";
import { notifyInterview } from "@/lib/server/notifications";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, invalid: 400, conflict: 409, gone: 410 } as const;

/** Mark an interview completed, no-show or cancelled. Cancelling emails both sides. */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/interviews/[id]">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = interviewStatusUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid interview status" }, { status: 400 });

  const result = await updateInterviewStatus(id, parsed.data.status);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });
  if (parsed.data.status === "cancelled") {
    await notifyInterview(id, "cancelled", { notifyCandidate: parsed.data.notifyCandidate });
  }
  return NextResponse.json(result);
}
