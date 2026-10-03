import { after, NextResponse, type NextRequest } from "next/server";
import { cancelByCandidate } from "@/lib/server/interviewRepository";
import { notifyInterview } from "@/lib/server/notifications";
import { SCHEDULE_STATUS_FOR_CODE, scheduleRateLimitResponse } from "@/lib/server/scheduleRoute";

export const runtime = "nodejs";

/** Candidate cancels: the interview is kept as cancelled, the link closes, both sides get an email. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/schedule/[token]/cancel">) {
  const { token } = await ctx.params;
  const limited = scheduleRateLimitResponse(request.headers, token);
  if (limited) return limited;

  const result = await cancelByCandidate(token);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: SCHEDULE_STATUS_FOR_CODE[result.code] });
  after(() => notifyInterview(result.interviewId, "cancelled"));
  return NextResponse.json({ ok: true });
}
