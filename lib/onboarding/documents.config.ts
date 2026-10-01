import type { DocumentRequirement } from "@/types/onboarding";

export const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: "identityProof",
    label: "Identity Proof",
    description: "Aadhaar card, passport, or driving licence",
    required: true,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSizeMB: 5,
  },
  {
    id: "addressProof",
    label: "Address Proof",
    description: "Utility bill, rental agreement, or bank statement",
    required: true,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSizeMB: 5,
  },
  {
    id: "resume",
    label: "Resume",
    description: "Your most recent resume or CV",
    required: true,
    acceptedFormats: ["PDF", "DOC", "DOCX"],
    maxSizeMB: 5,
  },
  {
    id: "educationalCertificates",
    label: "Educational Certificates",
    description: "Degree or diploma certificates, if applicable",
    required: false,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSizeMB: 10,
  },
  {
    id: "offerLetter",
    label: "Offer Letter",
    description: "Issued by Peak Process Partners HR",
    required: true,
    providedByHR: true,
    acceptedFormats: [],
    maxSizeMB: 0,
  },
];
