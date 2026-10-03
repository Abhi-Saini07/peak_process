import "server-only";
import { NextResponse } from "next/server";
import { checkScheduleRateLimit } from "@/lib/server/rateLimit";

/** Shared by the public schedule routes: the 429 response, or null to carry on. */
export function scheduleRateLimitResponse(headers: Headers, token: string): NextResponse | null {
  const limit = checkScheduleRateLimit(headers, token);
  if (limit.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
  );
}

export const SCHEDULE_STATUS_FOR_CODE = { not_found: 404, invalid: 400, conflict: 409, gone: 410 } as const;
