import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { updateCandidateDetails } from "@/lib/server/applicationRepository";
import { candidateDetailsSchema } from "@/lib/schemas/application.schema";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, conflict: 409 } as const;

/** HR corrects the candidate's details (shared by all their applications; audited). */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/candidate">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = candidateDetailsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details." }, { status: 400 });
  }
  const result = await updateCandidateDetails(id, parsed.data, auth.admin.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });
  return NextResponse.json(result);
}
