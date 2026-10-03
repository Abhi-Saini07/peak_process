import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { createScheduleInvite } from "@/lib/server/interviewRepository";
import { scheduleInviteSchema } from "@/lib/recruitment/interviews";
import { notifySchedulingInvite } from "@/lib/server/notifications";
import { absoluteUrl } from "@/lib/site";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, invalid: 400, conflict: 409, gone: 410 } as const;

/**
 * Creates a self-scheduling link and emails it to the candidate. The link is
 * also returned once so HR can copy it (only its hash is stored).
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/schedule-invites">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = scheduleInviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the scheduling details." }, { status: 400 });
  }
  const result = await createScheduleInvite(id, parsed.data, auth.admin.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });

  await notifySchedulingInvite(result.inviteId, result.token);
  return NextResponse.json({ inviteId: result.inviteId, link: absoluteUrl(`/schedule/${result.token}`) }, { status: 201 });
}
