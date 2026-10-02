import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { addApplicationNote, getApplicationNotes } from "@/lib/server/applicationRepository";
import { noteInputSchema } from "@/lib/recruitment/notes";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/notes">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const notes = await getApplicationNotes(id);
  if (!notes) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/notes">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const parsed = noteInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid note" }, { status: 400 });
  }

  const note = await addApplicationNote(id, parsed.data, auth.admin.id);
  if (!note) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({ note }, { status: 201 });
}
