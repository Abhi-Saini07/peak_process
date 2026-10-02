-- CreateEnum
CREATE TYPE "RejectReason" AS ENUM ('skills_experience', 'location_workmode', 'compensation', 'failed_knockout', 'stronger_candidates', 'incomplete_unresponsive', 'withdrew', 'other');

-- AlterTable
ALTER TABLE "application_status_history" ADD COLUMN     "reject_note" TEXT,
ADD COLUMN     "reject_reason" "RejectReason";

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN     "reject_note" TEXT,
ADD COLUMN     "reject_reason" "RejectReason",
ADD COLUMN     "stage_entered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: existing applications entered their current stage at their
-- last recorded transition into it, or at applied_at when there is none.
UPDATE "job_applications" ja
SET "stage_entered_at" = COALESCE(
  (SELECT MAX(h."changed_at") FROM "application_status_history" h
    WHERE h."application_id" = ja."id" AND h."new_status" = ja."status"),
  ja."applied_at"
);

-- A reject reason only exists on rejected applications, and "other" needs a note.
ALTER TABLE "job_applications" ADD CONSTRAINT "chk_job_applications_reject_reason" CHECK (
    ("status" = 'rejected' OR ("reject_reason" IS NULL AND "reject_note" IS NULL))
    AND ("reject_reason" IS DISTINCT FROM 'other' OR length(trim(coalesce("reject_note", ''))) > 0)
);
