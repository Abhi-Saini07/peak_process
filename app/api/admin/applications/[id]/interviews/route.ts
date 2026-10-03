import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { createManualInterview } from "@/lib/server/interviewRepository";
import { manualInterviewSchema } from "@/lib/recruitment/interviews";
import { notifyInterview } from "@/lib/server/notifications";
import { logAdminAction } from "@/lib/server/auditLog";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, invalid: 400, conflict: 409, gone: 410 } as const;

/** HR books an interview directly. Emails the interviewer, and the candidate unless told not to. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/interviews">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = manualInterviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the interview details." }, { status: 400 });
  }
  const result = await createManualInterview(id, parsed.data, auth.admin.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });

  await logAdminAction({ actorAdminId: auth.admin.id, action: "interview.schedule", entity: "interview", entityId: result.interviewId, meta: { applicationId: id } }).catch(
    (error) => console.error("[interviews] Couldn't write the audit log", error),
  );
  // Awaited (best-effort) so the emails show in the timeline on refresh.
  await notifyInterview(result.interviewId, "scheduled", { notifyCandidate: parsed.data.notifyCandidate });
  return NextResponse.json(result, { status: 201 });
}
