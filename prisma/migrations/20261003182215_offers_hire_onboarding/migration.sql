-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'offered' BEFORE 'selected';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "source_application_id" CHAR(36);

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "employee_id" CHAR(36),
ADD COLUMN     "offer_details" JSONB,
ADD COLUMN     "offer_sent_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "onboarding_invites" (
    "id" CHAR(36) NOT NULL,
    "employee_id" CHAR(36) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_by_admin_id" CHAR(36),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_log" (
    "id" CHAR(36) NOT NULL,
    "actor_admin_id" CHAR(36),
    "action" VARCHAR(64) NOT NULL,
    "entity" VARCHAR(64) NOT NULL,
    "entity_id" VARCHAR(64),
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_invites_token_hash_key" ON "onboarding_invites"("token_hash");

-- CreateIndex
CREATE INDEX "idx_onboarding_invites_employee" ON "onboarding_invites"("employee_id");

-- CreateIndex
CREATE INDEX "idx_admin_audit_log_entity" ON "admin_audit_log"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "idx_admin_audit_log_created" ON "admin_audit_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_source_application_id_key" ON "employees"("source_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_employee_id_key" ON "job_applications"("employee_id");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_source_application_id_fkey" FOREIGN KEY ("source_application_id") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_invites" ADD CONSTRAINT "onboarding_invites_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_invites" ADD CONSTRAINT "onboarding_invites_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_admin_id_fkey" FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

