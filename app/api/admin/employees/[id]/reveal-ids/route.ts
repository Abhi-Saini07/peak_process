import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { revealGovernmentIds } from "@/lib/server/employeeRepository";

export const runtime = "nodejs";

/** Full government ID numbers for one employee. Every call is written to AdminAuditLog. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/admin/employees/[id]/reveal-ids">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const ids = await revealGovernmentIds(id, auth.admin.id);
  if (!ids) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  return NextResponse.json(ids, { headers: { "Cache-Control": "no-store" } });
}
