-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "knockout_answers" JSONB,
ADD COLUMN     "knockout_flagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "knockouts" JSONB;
