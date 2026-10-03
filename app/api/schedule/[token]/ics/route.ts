import { NextResponse, type NextRequest } from "next/server";
import { getBookedInterviewForToken } from "@/lib/server/interviewRepository";
import { buildIcs } from "@/lib/recruitment/ics";
import { interviewModeLabel } from "@/lib/recruitment/interviews";
import { absoluteUrl } from "@/lib/site";
import { scheduleRateLimitResponse } from "@/lib/server/scheduleRoute";

export const runtime = "nodejs";

/** The booked interview as an iCalendar file (RFC 5545). */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/schedule/[token]/ics">) {
  const { token } = await ctx.params;
  const limited = scheduleRateLimitResponse(request.headers, token);
  if (limited) return limited;

  const booked = await getBookedInterviewForToken(token);
  if (!booked) return NextResponse.json({ error: "There's no booked interview on this link." }, { status: 404 });
  const { interview, jobTitle } = booked;
  const manageUrl = absoluteUrl(`/schedule/${token}`);
  const body = buildIcs({
    uid: `interview-${interview.id}@peakprocesspartners`,
    start: interview.scheduledAt,
    end: new Date(interview.scheduledAt.getTime() + interview.durationMinutes * 60_000),
    summary: `Interview: ${jobTitle} (Peak Process Partners)`,
    description: [
      `${interviewModeLabel(interview.mode)}, ${interview.durationMinutes} minutes.`,
      interview.meetingUrl ? `Join: ${interview.meetingUrl}` : null,
      `Reschedule or cancel: ${manageUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: interview.location ?? interview.meetingUrl ?? undefined,
    url: interview.meetingUrl ?? manageUrl,
    stamp: interview.createdAt,
  });
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="interview.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
