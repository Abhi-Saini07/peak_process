import { NextResponse, type NextRequest } from "next/server";
import { getOrCreateEmployee } from "@/lib/server/session";
import { removeDocument, upsertDocumentMeta } from "@/lib/server/onboardingRepository";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/onboarding/documents/[docId]">) {
  const { docId } = await ctx.params;
  const requirement = DOCUMENT_REQUIREMENTS.find((d) => d.id === docId);
  if (!requirement) {
    return NextResponse.json({ error: "Unknown document type" }, { status: 400 });
  }
  if (requirement.providedByHR) {
    return NextResponse.json({ error: "This document is provided by HR and can't be uploaded." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const employee = await getOrCreateEmployee();

  const maxBytes = requirement.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const meta = await upsertDocumentMeta(employee.id, docId, {
      status: "error",
      errorMessage: `File is larger than the ${requirement.maxSizeMB}MB limit for this document.`,
    });
    return NextResponse.json(meta, { status: 413 });
  }

  // TODO(object storage): metadata-only stub, as requested — file bytes are
  // not persisted anywhere. To wire real storage, replace this block with
  // e.g. Vercel Blob:
  //   import { put } from "@vercel/blob";
  //   const blob = await put(`documents/${employee.id}/${docId}-${file.name}`, file, { access: "private" });
  //   storagePath = blob.url;
  // (set BLOB_READ_WRITE_TOKEN in the environment). No other layer needs to
  // change — upsertDocumentMeta already accepts and stores storagePath.
  const storagePath: string | null = null;

  try {
    const meta = await upsertDocumentMeta(employee.id, docId, {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      storagePath,
      status: "uploaded",
      uploadedAt: new Date(),
    });
    return NextResponse.json(meta);
  } catch {
    const meta = await upsertDocumentMeta(employee.id, docId, {
      status: "error",
      errorMessage: "Upload failed — please try again.",
    });
    return NextResponse.json(meta, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/onboarding/documents/[docId]">) {
  const { docId } = await ctx.params;
  const employee = await getOrCreateEmployee();
  await removeDocument(employee.id, docId);
  return NextResponse.json({ ok: true });
}
