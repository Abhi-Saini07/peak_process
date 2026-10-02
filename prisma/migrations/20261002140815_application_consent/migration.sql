-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "consent_version" VARCHAR(20),
ADD COLUMN     "consented_at" TIMESTAMPTZ(3);
