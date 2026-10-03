import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { bookSlot } from "@/lib/server/interviewRepository";
import { notifyInterview } from "@/lib/server/notifications";
import { SCHEDULE_STATUS_FOR_CODE, scheduleRateLimitResponse } from "@/lib/server/scheduleRoute";

export const runtime = "nodejs";

const bodySchema = z.object({ slot: z.iso.datetime({ offset: true }) });

/** Candidate books one of the offered times. The slot is re-checked on the server. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/schedule/[token]/book">) {
  const { token } = await ctx.params;
  const limited = scheduleRateLimitResponse(request.headers, token);
  if (limited) return limited;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Pick one of the times shown." }, { status: 400 });

  const result = await bookSlot(token, parsed.data.slot);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: SCHEDULE_STATUS_FOR_CODE[result.code] });
  after(() => notifyInterview(result.interviewId, result.rescheduled ? "rescheduled" : "scheduled", { scheduleToken: token }));
  return NextResponse.json({ ok: true });
}
