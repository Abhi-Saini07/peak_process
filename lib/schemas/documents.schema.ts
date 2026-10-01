import { z } from "zod";

export const documentMetaSchema = z.object({
  id: z.string(),
  docId: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  uploadedAt: z.string(),
  status: z.enum(["pending", "uploading", "uploaded", "error", "provided"]),
  errorMessage: z.string().optional(),
});

export const documentsSchema = z.object({
  items: z.record(z.string(), documentMetaSchema).default({}),
});

export type DocumentsData = z.infer<typeof documentsSchema>;

export const documentsDefaults: DocumentsData = { items: {} };
