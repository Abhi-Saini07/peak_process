import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { updateEmployeeSection } from "@/lib/server/employeeRepository";
import { employeeEditRequestSchema } from "@/lib/onboarding/employeeEdit";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, invalid: 400 } as const;

/** HR edits one section of a new hire's or employee's record (audited). */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/employees/[id]">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = employeeEditRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Unknown section" }, { status: 400 });

  const result = await updateEmployeeSection(id, parsed.data.section, parsed.data.data, auth.admin.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });
  return NextResponse.json(result);
}
