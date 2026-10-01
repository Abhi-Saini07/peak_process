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
  salaryMin: number | null; // only populated when the job's salaryPublic flag is set
  salaryMax: number | null;
  overview: string | null;
  responsibilities: string | null;
  requirements: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string | null;
  benefits: string | null;
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
}

export interface ApplicationStatusHistoryEntry {
  id: string;
  oldStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedByName: string | null;
  changedAt: string;
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
  documents: ApplicationDocumentMeta[];
  history: ApplicationStatusHistoryEntry[];
}
