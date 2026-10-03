import "server-only";
import { DocumentType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";

/**
 * The Offer Letter is issued by HR, not uploaded by the employee — seed it as
 * already "provided" so the Documents step's completion check (identical
 * logic to lib/onboarding/completion.ts on the client) sees it satisfied from
 * day one. Used for anonymous sessions and for hired candidates.
 */
export async function seedHrProvidedDocuments(
  employeeId: string,
  db: Prisma.TransactionClient = prisma,
): Promise<void> {
  const offerLetter = DOCUMENT_REQUIREMENTS.find((doc) => doc.providedByHR);
  if (!offerLetter) return;
  await db.employeeDocument.create({
    data: {
      employeeId,
      documentType: DocumentType.offerLetter,
      fileName: "Offer_Letter_PeakProcessPartners.pdf",
      fileSize: 0,
      mimeType: "application/pdf",
      status: "provided",
      uploadedAt: new Date(),
    },
  });
}

