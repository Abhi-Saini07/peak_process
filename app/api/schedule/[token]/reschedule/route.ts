import { after, NextResponse, type NextRequest } from "next/server";
import { rescheduleByCandidate } from "@/lib/server/interviewRepository";
import { notifyInterview } from "@/lib/server/notifications";
import { SCHEDULE_STATUS_FOR_CODE, scheduleRateLimitResponse } from "@/lib/server/scheduleRoute";

export const runtime = "nodejs";

/**
 * Candidate wants a new time: the booked interview is cancelled (kept as
 * history) and the link reopens. Only the interviewer hears about the
 * cancellation now; both get "rescheduled" once a new time is booked.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/schedule/[token]/reschedule">) {
  const { token } = await ctx.params;
  const limited = scheduleRateLimitResponse(request.headers, token);
  if (limited) return limited;

  const result = await rescheduleByCandidate(token);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: SCHEDULE_STATUS_FOR_CODE[result.code] });
  after(() => notifyInterview(result.interviewId, "cancelled", { notifyCandidate: false }));
  return NextResponse.json({ ok: true });
}
