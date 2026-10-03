import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { makeOffer } from "@/lib/server/hiringRepository";
import { z } from "zod";
import { offerInputSchema, validateOfferDates } from "@/lib/recruitment/offers";
import { notifyOffer } from "@/lib/server/notifications";

export const runtime = "nodejs";

const STATUS_FOR_CODE = { not_found: 404, illegal_transition: 422, conflict: 409 } as const;

/** Makes (or revises) an offer: interview → offered, in one transaction with its history row. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/offer">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const notify = z.object({ notifyCandidate: z.boolean().optional() }).safeParse(body);
  const parsed = offerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the offer details." }, { status: 400 });
  }
  const dateError = validateOfferDates(parsed.data, Date.now());
  if (dateError) return NextResponse.json({ error: dateError }, { status: 400 });

  const result = await makeOffer(id, parsed.data, auth.admin.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: STATUS_FOR_CODE[result.code] });
  if (!notify.success || notify.data.notifyCandidate !== false) await notifyOffer(id);
  return NextResponse.json(result);
}
