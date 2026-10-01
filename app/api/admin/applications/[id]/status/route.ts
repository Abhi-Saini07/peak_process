import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { updateApplicationStatus } from "@/lib/server/applicationRepository";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["applied", "under_review", "shortlisted", "interview", "selected", "rejected"]),
});

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/status">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await updateApplicationStatus(id, parsed.data.status, auth.admin.id);
  if ("error" in result) return NextResponse.json(result, { status: 404 });
  return NextResponse.json(result);
}
