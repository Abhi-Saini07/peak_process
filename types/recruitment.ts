import type { RejectReason } from "@/lib/recruitment/rejection";
import type { KnockoutAnswer, KnockoutQuestion, PublicKnockoutQuestion } from "@/lib/recruitment/knockouts";
import type {
  ApplicationStatus,
  EmploymentType,
  JobStatus,
  WorkMode,
} from "@/lib/recruitment/constants";

export interface JobSummary {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  status: JobStatus;
  deadline: string | null; // yyyy-mm-dd
  createdAt: string; // ISO
  applicationCount: number;
}

export interface JobDetail extends JobSummary {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPublic: boolean;
  overview: string | null;
  responsibilities: string | null;
  requirements: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string | null;
  benefits: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  knockouts: KnockoutQuestion[];
}

/** What the public site is allowed to see — no status, no applicant counts. */
export interface PublicJobSummary {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employmentType: EmploymentType;
  workMode: WorkMode;
  experienceMinYears: number | null;
  experienceMaxYears: number | null;
  overviewExcerpt: string | null;
}

export interface PublicJobDetail extends PublicJobSummary {
  publishedAt: string | null; // ISO
  deadline: string | null; // yyyy-mm-dd
  salaryMin: number | null; // only populated when the job's salaryPublic flag is set
  salaryMax: number | null;
  overview: string | null;
  responsibilities: string | null;
  requirements: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string | null;
  benefits: string | null;
  /** Screening questions, without the qualifying answer. */
  knockouts: PublicKnockoutQuestion[];
}

export interface ApplicationSummary {
  id: string;
  reference: string;
  candidateId: string;
  candidateName: string;
  email: string;
  phone: string | null;
  experienceYears: number | null;
  status: ApplicationStatus;
  appliedAt: string;
  /** When the application entered its current status (ISO). */
  stageEnteredAt: string;
  rejectReason: RejectReason | null;
  /** A screening answer was missing or didn't qualify. Never auto-rejects. */
  knockoutFlagged: boolean;
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedByName: string | null;
  changedAt: string;
  rejectReason: RejectReason | null;
  rejectNote: string | null;
}

export interface ApplicationNoteEntry {
  id: string;
  body: string;
  /** 1–5, or null when the note has no rating. */
  rating: number | null;
  authorName: string | null;
  createdAt: string;
}

export interface ApplicationDocumentMeta {
  id: string;
  documentType: "resume" | "other";
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface ApplicationDetail extends ApplicationSummary {
  jobId: string;
  jobTitle: string;
  location: string | null;
  education: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  coverLetter: string | null;
  rejectNote: string | null;
  documents: ApplicationDocumentMeta[];
  history: ApplicationStatusHistoryEntry[];
  notes: ApplicationNoteEntry[];
  knockoutAnswers: KnockoutAnswer[];
}
