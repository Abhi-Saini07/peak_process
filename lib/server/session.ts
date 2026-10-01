import "server-only";
import { cookies } from "next/headers";
import { DocumentType, type Employee } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DOCUMENT_REQUIREMENTS } from "@/lib/onboarding/documents.config";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ppp_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days — onboarding can be resumed later

/**
 * The app has no login: this cookie *is* the session. On first visit
 * (no cookie, or a cookie that doesn't match any row) a new `employees`
 * row is created and its sessionToken — not its primary key — becomes the
 * cookie value, matching the localStorage-era behavior of "just works,
 * no signup step" while keeping the bearer credential distinct from the
 * row's internal id.
 */
export async function getOrCreateEmployee(): Promise<Employee> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(COOKIE_NAME)?.value;

  if (existingToken) {
    const employee = await prisma.employee.findUnique({ where: { sessionToken: existingToken } });
    if (employee) return employee;
  }

  const employee = await prisma.employee.create({ data: {} });

  // The Offer Letter is issued by HR, not uploaded by the employee — seed
  // it as already "provided" so the Documents step's completion check
  // (identical logic to lib/onboarding/completion.ts on the client) sees
  // it satisfied from day one, matching the old localStorage mock's
  // seedState() behavior exactly.
  const offerLetter = DOCUMENT_REQUIREMENTS.find((doc) => doc.providedByHR);
  if (offerLetter) {
    await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        documentType: DocumentType.offerLetter,
        fileName: "Offer_Letter_PeakProcessPartners.pdf",
        fileSize: 0,
        mimeType: "application/pdf",
        status: "provided",
        uploadedAt: new Date(),
      },
    });
  }

  cookieStore.set(COOKIE_NAME, employee.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return employee;
}
