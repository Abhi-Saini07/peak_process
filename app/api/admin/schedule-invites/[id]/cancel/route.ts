import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { cancelScheduleInvite } from "@/lib/server/interviewRepository";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, invalid: 400, conflict: 409, gone: 410 } as const;

/** Withdraws a scheduling link that hasn't been booked yet. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/admin/schedule-invites/[id]/cancel">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const result = await cancelScheduleInvite(id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });
  return NextResponse.json(result);
}
