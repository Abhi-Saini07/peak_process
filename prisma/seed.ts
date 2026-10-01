/**
 * Three demo employees (originally db/legacy-mysql/seed.sql), via Prisma so Priya
 * Sharma's Aadhaar/PAN can be properly AES-256-GCM encrypted with the
 * real ENCRYPTION_KEY — something a plain .sql file can't produce. Run
 * with `npx prisma db seed` (requires DATABASE_URL and ENCRYPTION_KEY set).
 */
import { PrismaClient } from "@prisma/client";
import { encryptField } from "../lib/security/encryption";

const prisma = new PrismaClient();

const DEMO_IDS = {
  priya: "11111111-1111-1111-1111-111111111111",
  rahul: "22222222-2222-2222-2222-222222222222",
  ananya: "33333333-3333-3333-3333-333333333333",
} as const;

async function main() {
  // Cascades to every child table via ON DELETE CASCADE — safe to re-run.
  await prisma.employee.deleteMany({ where: { id: { in: Object.values(DEMO_IDS) } } });

  await prisma.employee.create({
    data: {
      id: DEMO_IDS.priya,
      sessionToken: "a1111111-1111-1111-1111-111111111111",
      fullName: "Priya Sharma",
      status: "submitted",
      submissionReference: "PPP-DEMO0001",
      submittedAt: new Date("2026-09-10T09:45:00.000Z"),
      createdAt: new Date("2026-09-10T09:10:00.000Z"),
      personalInformation: {
        create: {
          firstName: "Priya",
          lastName: "Sharma",
          dateOfBirth: new Date("1998-04-12"),
          gender: "female",
          personalEmail: "priya.sharma@example.com",
          phone: "+91 98765 43210",
          homeAddress: "221B Residency Road, Bengaluru, Karnataka, 560025",
          aadhaarNumberEnc: encryptField("234567890123"),
          panNumberEnc: encryptField("ABCDE1234F"),
        },
      },
      references: {
        create: [
          {
            referenceType: "primary",
            name: "Rahul Mehta",
            relationship: "Former Manager",
            company: "Initech",
            email: "rahul.mehta@example.com",
            phone: "+91 91234 56780",
          },
          {
            referenceType: "secondary",
            name: "Anita Rao",
            relationship: "Senior Colleague",
            company: "Initech",
            email: "anita.rao@example.com",
            phone: "+91 91234 56781",
          },
        ],
      },
      emergencyContact: {
        create: {
          name: "Sunita Sharma",
          relationship: "Mother",
          primaryPhone: "+91 99887 76655",
          sameAsHomeAddress: true,
        },
      },
      healthInsurance: {
        create: {
          coverageType: "self_spouse",
          nomineeName: "Karan Sharma",
          nomineeRelationship: "Spouse",
          dependents: {
            create: [{ name: "Karan Sharma", relationship: "Spouse", dateOfBirth: new Date("1997-02-20") }],
          },
        },
      },
      documents: {
        create: [
          {
            documentType: "identityProof",
            fileName: "priya_aadhaar.pdf",
            fileSize: 184320,
            mimeType: "application/pdf",
            status: "uploaded",
            uploadedAt: new Date("2026-09-10T09:20:00.000Z"),
          },
          {
            documentType: "addressProof",
            fileName: "priya_utility_bill.pdf",
            fileSize: 152040,
            mimeType: "application/pdf",
            status: "uploaded",
            uploadedAt: new Date("2026-09-10T09:21:00.000Z"),
          },
          {
            documentType: "resume",
            fileName: "priya_resume.pdf",
            fileSize: 98304,
            mimeType: "application/pdf",
            status: "uploaded",
            uploadedAt: new Date("2026-09-10T09:22:00.000Z"),
          },
          {
            documentType: "offerLetter",
            fileName: "Offer_Letter_PeakProcessPartners.pdf",
            fileSize: 0,
            mimeType: "application/pdf",
            status: "provided",
            uploadedAt: new Date("2026-09-10T09:10:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.employee.create({
    data: {
      id: DEMO_IDS.rahul,
      sessionToken: "a2222222-2222-2222-2222-222222222222",
      fullName: "Rahul Verma",
      status: "in_progress",
      createdAt: new Date("2026-09-15T14:00:00.000Z"),
      personalInformation: {
        create: {
          firstName: "Rahul",
          lastName: "Verma",
          dateOfBirth: new Date("1995-11-02"),
          gender: "male",
          personalEmail: "rahul.verma@example.com",
          phone: "+91 90000 11122",
          homeAddress: "14 MG Road, Pune, Maharashtra, 411001",
        },
      },
      references: {
        create: [
          {
            referenceType: "primary",
            name: "Devika Nair",
            relationship: "Former Manager",
            company: "Contoso",
            email: "devika.nair@example.com",
            phone: "+91 90000 22233",
          },
        ],
      },
      emergencyContact: {
        create: { name: "Meena Verma", relationship: "Mother", sameAsHomeAddress: false },
      },
    },
  });

  await prisma.employee.create({
    data: {
      id: DEMO_IDS.ananya,
      sessionToken: "a3333333-3333-3333-3333-333333333333",
      fullName: "Ananya Iyer",
      status: "in_progress",
      createdAt: new Date("2026-09-20T11:30:00.000Z"),
    },
  });

  console.log("Seeded 3 demo employees (Priya Sharma's Aadhaar/PAN are encrypted, matching production behavior).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
