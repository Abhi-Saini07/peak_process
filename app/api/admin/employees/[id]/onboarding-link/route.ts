import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { reissueOnboardingInvite } from "@/lib/server/hiringRepository";
import { onboardingStartUrl } from "@/lib/server/onboardingInvites";
import { notifyOnboardingInvite } from "@/lib/server/notifications";

export const runtime = "nodejs";

/** A new onboarding link for an employee; older unused links stop working. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/admin/employees/[id]/onboarding-link">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const invite = await reissueOnboardingInvite(id, auth.admin.id);
  if (!invite) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  const onboardingUrl = onboardingStartUrl(invite.token);
  await notifyOnboardingInvite(id, onboardingUrl, new Date(invite.expiresAt));
  return NextResponse.json({ onboardingUrl, expiresAt: invite.expiresAt });
}
