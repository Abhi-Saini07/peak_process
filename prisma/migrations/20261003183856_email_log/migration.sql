-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('sent', 'failed', 'logged');

-- CreateTable
CREATE TABLE "email_log" (
    "id" CHAR(36) NOT NULL,
    "application_id" CHAR(36),
    "employee_id" CHAR(36),
    "template" VARCHAR(48) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "provider_message_id" VARCHAR(128),
    "error" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_email_log_application_created" ON "email_log"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_email_log_employee" ON "email_log"("employee_id");

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
