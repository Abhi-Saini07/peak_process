import "server-only";
import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

/**
 * Object storage for resumes/other application documents — a self-hosted
 * MinIO instance (S3-compatible API) rather than local disk, since Vercel's
 * serverless functions can't write to arbitrary local paths (the original
 * local-disk implementation this replaced worked in dev but failed outright
 * in production). Callers only ever see `storagePath` (the S3 object key) +
 * `readStoredFile`/`saveUploadedFile` — same shape as before, so nothing
 * outside this file changed.
 */

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150) || "file";
}

function getClient(): S3Client {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKeyId = process.env.MINIO_ACCESS_KEY;
  const secretAccessKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY must all be set.");
  }
  return new S3Client({
    region: "us-east-1", // required by the SDK; MinIO ignores the value but one must be set
    endpoint: `https://${endpoint}`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // required for MinIO and most non-AWS S3-compatible endpoints
  });
}

function getBucket(): string {
  const bucket = process.env.MINIO_BUCKET;
  if (!bucket) throw new Error("MINIO_BUCKET must be set.");
  return bucket;
}

export interface SavedFileMeta {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/** Uploads a file under `<subdir>/<uuid>-<name>`, returning DB-ready metadata. */
export async function saveUploadedFile(file: File, subdir: string): Promise<SavedFileMeta> {
  const safeName = sanitizeFileName(file.name);
  const key = `${subdir}/${randomUUID()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await getClient().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  return {
    storagePath: key,
    fileName: file.name || safeName,
    fileSize: file.size,
    mimeType: file.type || "application/octet-stream",
  };
}

/** Reads a previously-saved file back into memory for an authenticated download route to stream. */
export async function readStoredFile(storagePath: string): Promise<Buffer> {
  const res = await getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: storagePath }));
  const stream = res.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
