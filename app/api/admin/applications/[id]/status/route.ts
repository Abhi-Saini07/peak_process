import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { updateApplicationStatus } from "@/lib/server/applicationRepository";
import { validateRejectInput, type RejectInput } from "@/lib/recruitment/rejection";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["applied", "under_review", "shortlisted", "interview", "offered", "selected", "rejected"]),
  rejectReason: z.unknown().optional(),
  rejectNote: z.unknown().optional(),
});

const STATUS_FOR_CODE = { not_found: 404, illegal_transition: 422, conflict: 409 } as const;

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/status">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { status, rejectReason, rejectNote } = parsed.data;
  let reject: RejectInput | null = null;
  if (status === "rejected") {
    const check = validateRejectInput({ reason: rejectReason, note: rejectNote });
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
    reject = check.value;
  } else if (rejectReason != null || rejectNote != null) {
    return NextResponse.json({ error: "A reject reason is only allowed when rejecting." }, { status: 400 });
  }

  const result = await updateApplicationStatus(id, status, auth.admin.id, reject);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });
  }
  return NextResponse.json(result);
}
