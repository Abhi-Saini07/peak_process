import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { hireApplication } from "@/lib/server/hiringRepository";
import { onboardingStartUrl } from "@/lib/server/onboardingInvites";
import { notifyOnboardingInvite } from "@/lib/server/notifications";

export const runtime = "nodejs";

/**
 * "Mark as hired": offered → selected, creating the Employee and an
 * onboarding link in one transaction. Safe to call twice: the second call
 * returns the same Employee and creates nothing.
 */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/hire">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const result = await hireApplication(id, auth.admin.id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.code === "not_found" ? 404 : 422 });
  }
  const onboardingUrl = result.inviteToken ? onboardingStartUrl(result.inviteToken) : null;
  if (onboardingUrl && result.inviteExpiresAt) {
    await notifyOnboardingInvite(result.employeeId, onboardingUrl, new Date(result.inviteExpiresAt));
  }
  return NextResponse.json({
    employeeId: result.employeeId,
    alreadyHired: result.alreadyHired,
    onboardingUrl,
    expiresAt: result.inviteExpiresAt,
  });
}
