import { NextResponse, type NextRequest } from "next/server";
import { requireAdminUserOrResponse } from "@/lib/server/adminSession";
import { getApplicationDocumentForDownload, readStoredFile } from "@/lib/server/applicationRepository";

export const runtime = "nodejs";

/** Authenticated resume/document download — the only read path for an
 *  uploaded application file. docId is validated against applicationId
 *  server-side before the file is ever touched. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/admin/applications/[id]/documents/[docId]">) {
  const auth = await requireAdminUserOrResponse();
  if ("response" in auth) return auth.response;

  const { id, docId } = await ctx.params;
  const doc = await getApplicationDocumentForDownload(id, docId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const buffer = await readStoredFile(doc.storagePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
