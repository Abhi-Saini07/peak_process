import { NextResponse, type NextRequest } from "next/server";
import { redeemOnboardingInvite } from "@/lib/server/onboardingInvites";
import { employeeSessionCookie, readEmployeeSessionToken } from "@/lib/server/session";
import { FIRST_STEP_SLUG } from "@/lib/onboarding/steps.meta";

export const runtime = "nodejs";

/**
 * The link in a hired candidate's onboarding email. A good link binds this
 * browser to their Employee (the same session cookie anonymous onboarding
 * uses), marks the link used and opens the first step. Anything else goes to
 * a friendly page explaining what happened.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/onboarding/start/[token]">) {
  const { token } = await ctx.params;
  const result = await redeemOnboardingInvite(token, await readEmployeeSessionToken());

  if (result.status === "ok" || result.status === "already_yours") {
    const response = NextResponse.redirect(new URL(`/onboarding/${FIRST_STEP_SLUG}`, request.url));
    const cookie = employeeSessionCookie(result.sessionToken);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const response = NextResponse.redirect(new URL(`/onboarding-link/${result.status}`, request.url));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
