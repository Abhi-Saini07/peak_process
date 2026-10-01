-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('in_progress', 'submitted');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('female', 'male', 'non-binary', 'prefer-not-to-say');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('primary', 'secondary');

-- CreateEnum
CREATE TYPE "CoverageType" AS ENUM ('self', 'self-spouse', 'self-family');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('identityProof', 'addressProof', 'resume', 'educationalCertificates', 'offerLetter');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'uploading', 'uploaded', 'error', 'provided');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('onsite', 'hybrid', 'remote');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'published', 'closed');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'under_review', 'shortlisted', 'interview', 'selected', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicationDocumentType" AS ENUM ('resume', 'other');

-- CreateTable
CREATE TABLE "employees" (
    "id" CHAR(36) NOT NULL,
    "session_token" CHAR(36) NOT NULL,
    "full_name" VARCHAR(255),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'in_progress',
    "submission_reference" VARCHAR(32),
    "submitted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_information" (
    "employee_id" CHAR(36) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "date_of_birth" DATE,
    "gender" "Gender",
    "personal_email" VARCHAR(255),
    "phone" VARCHAR(20),
    "home_address" VARCHAR(500),
    "aadhaar_number_enc" BYTEA,
    "pan_number_enc" BYTEA,
    "uan_number_enc" BYTEA,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "personal_information_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "employee_references" (
    "id" CHAR(36) NOT NULL,
    "employee_id" CHAR(36) NOT NULL,
    "reference_type" "ReferenceType" NOT NULL,
    "name" VARCHAR(150),
    "relationship" VARCHAR(100),
    "company" VARCHAR(150),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employee_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "employee_id" CHAR(36) NOT NULL,
    "name" VARCHAR(150),
    "relationship" VARCHAR(100),
    "primary_phone" VARCHAR(20),
    "secondary_phone" VARCHAR(20),
    "same_as_home_address" BOOLEAN NOT NULL DEFAULT false,
    "address" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "health_insurance" (
    "employee_id" CHAR(36) NOT NULL,
    "coverage_type" "CoverageType",
    "nominee_name" VARCHAR(150),
    "nominee_relationship" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "health_insurance_pkey" PRIMARY KEY ("employee_id")
);

-- CreateTable
CREATE TABLE "health_insurance_dependents" (
    "id" CHAR(36) NOT NULL,
    "employee_id" CHAR(36) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "relationship" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_insurance_dependents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" CHAR(36) NOT NULL,
    "employee_id" CHAR(36) NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_name" VARCHAR(255),
    "file_size" INTEGER,
    "mime_type" VARCHAR(127),
    "storage_path" VARCHAR(1024),
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "error_message" VARCHAR(500),
    "uploaded_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" CHAR(36) NOT NULL,
    "clerk_user_id" VARCHAR(64),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" CHAR(36) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "department" VARCHAR(150),
    "location" VARCHAR(150),
    "employment_type" "EmploymentType" NOT NULL,
    "work_mode" "WorkMode" NOT NULL,
    "experience_min_years" SMALLINT,
    "experience_max_years" SMALLINT,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "salary_public" BOOLEAN NOT NULL DEFAULT false,
    "overview" TEXT,
    "responsibilities" TEXT,
    "requirements" TEXT,
    "required_skills" JSONB,
    "preferred_skills" JSONB,
    "education" VARCHAR(255),
    "benefits" TEXT,
    "deadline" DATE,
    "status" "JobStatus" NOT NULL DEFAULT 'draft',
    "created_by" CHAR(36),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "closed_at" TIMESTAMPTZ(3),

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" CHAR(36) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "location" VARCHAR(150),
    "experience_years" SMALLINT,
    "education" VARCHAR(255),
    "linkedin_url" VARCHAR(500),
    "portfolio_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" CHAR(36) NOT NULL,
    "job_id" CHAR(36) NOT NULL,
    "candidate_id" CHAR(36) NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "cover_letter" TEXT,
    "applied_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" CHAR(36) NOT NULL,
    "application_id" CHAR(36) NOT NULL,
    "document_type" "ApplicationDocumentType" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(127) NOT NULL,
    "storage_path" VARCHAR(1024) NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" CHAR(36) NOT NULL,
    "application_id" CHAR(36) NOT NULL,
    "old_status" "ApplicationStatus",
    "new_status" "ApplicationStatus" NOT NULL,
    "changed_by_admin_id" CHAR(36),
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_session_token_key" ON "employees"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "employees_submission_reference_key" ON "employees"("submission_reference");

-- CreateIndex
CREATE INDEX "idx_employee_references_employee" ON "employee_references"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_employee_references_type" ON "employee_references"("employee_id", "reference_type");

-- CreateIndex
CREATE INDEX "idx_health_insurance_dependents_employee" ON "health_insurance_dependents"("employee_id");

-- CreateIndex
CREATE INDEX "idx_employee_documents_employee" ON "employee_documents"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_employee_documents_type" ON "employee_documents"("employee_id", "document_type");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_clerk_user_id_key" ON "admin_users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "idx_jobs_status" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "idx_jobs_deadline" ON "jobs"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "idx_job_applications_job" ON "job_applications"("job_id");

-- CreateIndex
CREATE INDEX "idx_job_applications_candidate" ON "job_applications"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_job_applications_status" ON "job_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_job_applications_job_candidate" ON "job_applications"("job_id", "candidate_id");

-- CreateIndex
CREATE INDEX "idx_application_documents_application" ON "application_documents"("application_id");

-- CreateIndex
CREATE INDEX "idx_application_status_history_application" ON "application_status_history"("application_id");

-- AddForeignKey
ALTER TABLE "personal_information" ADD CONSTRAINT "personal_information_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_references" ADD CONSTRAINT "employee_references_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_insurance" ADD CONSTRAINT "health_insurance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_insurance_dependents" ADD CONSTRAINT "health_insurance_dependents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "health_insurance"("employee_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_admin_id_fkey" FOREIGN KEY ("changed_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddCheckConstraints
-- Prisma's schema DSL (as of 6.x) has no first-class way to express CHECK
-- constraints, so they're hand-appended here. Ported from the MySQL
-- migration (db/legacy-mysql/): REGEXP -> the PostgreSQL `~` operator.
ALTER TABLE "employees" ADD CONSTRAINT "chk_employees_submitted_consistency" CHECK (
    (status = 'submitted' AND submitted_at IS NOT NULL AND submission_reference IS NOT NULL)
    OR
    (status = 'in_progress' AND submitted_at IS NULL AND submission_reference IS NULL)
);

ALTER TABLE "personal_information" ADD CONSTRAINT "chk_personal_information_email" CHECK (
    personal_email IS NULL OR personal_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
ALTER TABLE "personal_information" ADD CONSTRAINT "chk_personal_information_phone" CHECK (
    phone IS NULL OR phone ~ '^\+?[0-9 -]{10,15}$'
);

ALTER TABLE "employee_references" ADD CONSTRAINT "chk_employee_references_email" CHECK (
    email IS NULL OR email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
ALTER TABLE "employee_references" ADD CONSTRAINT "chk_employee_references_phone" CHECK (
    phone IS NULL OR phone ~ '^\+?[0-9 -]{10,15}$'
);

ALTER TABLE "emergency_contacts" ADD CONSTRAINT "chk_emergency_contacts_phone" CHECK (
    primary_phone IS NULL OR primary_phone ~ '^\+?[0-9 -]{10,15}$'
);
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "chk_emergency_contacts_secondary_phone" CHECK (
    secondary_phone IS NULL OR secondary_phone ~ '^\+?[0-9 -]{10,15}$'
);
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "chk_emergency_contacts_address" CHECK (
    same_as_home_address = TRUE OR address IS NULL OR CHAR_LENGTH(TRIM(address)) >= 10
);

ALTER TABLE "employee_documents" ADD CONSTRAINT "chk_employee_documents_uploaded" CHECK (
    status NOT IN ('uploaded', 'provided') OR (file_name IS NOT NULL AND uploaded_at IS NOT NULL)
);
