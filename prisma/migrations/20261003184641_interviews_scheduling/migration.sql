-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('onsite', 'video', 'phone');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "ScheduleInviteStatus" AS ENUM ('pending', 'booked', 'cancelled', 'expired');

-- CreateTable
CREATE TABLE "interviews" (
    "id" CHAR(36) NOT NULL,
    "application_id" CHAR(36) NOT NULL,
    "scheduled_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "interviewer_admin_id" CHAR(36) NOT NULL,
    "meeting_url" VARCHAR(500),
    "location" VARCHAR(255),
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_by_admin_id" CHAR(36),
    "schedule_invite_id" CHAR(36),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_invites" (
    "id" CHAR(36) NOT NULL,
    "application_id" CHAR(36) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "interviewer_admin_id" CHAR(36) NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "meeting_url" VARCHAR(500),
    "location" VARCHAR(255),
    "window_start" TIMESTAMPTZ(3) NOT NULL,
    "window_end" TIMESTAMPTZ(3) NOT NULL,
    "status" "ScheduleInviteStatus" NOT NULL DEFAULT 'pending',
    "interview_id" CHAR(36),
    "created_by_admin_id" CHAR(36),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "schedule_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_interviews_application" ON "interviews"("application_id");

-- CreateIndex
CREATE INDEX "idx_interviews_interviewer_time" ON "interviews"("interviewer_admin_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_interviews_scheduled_at" ON "interviews"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_schedule_invites_token_hash" ON "schedule_invites"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "uq_schedule_invites_interview" ON "schedule_invites"("interview_id");

-- CreateIndex
CREATE INDEX "idx_schedule_invites_application" ON "schedule_invites"("application_id");

-- CreateIndex
CREATE INDEX "idx_schedule_invites_status_window" ON "schedule_invites"("status", "window_end");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_admin_id_fkey" FOREIGN KEY ("interviewer_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_schedule_invite_id_fkey" FOREIGN KEY ("schedule_invite_id") REFERENCES "schedule_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_invites" ADD CONSTRAINT "schedule_invites_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_invites" ADD CONSTRAINT "schedule_invites_interviewer_admin_id_fkey" FOREIGN KEY ("interviewer_admin_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_invites" ADD CONSTRAINT "schedule_invites_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_invites" ADD CONSTRAINT "schedule_invites_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- An interviewer can't hold two scheduled interviews starting at the same time.
-- Booking relies on this as the last line of defence against double-booking.
CREATE UNIQUE INDEX "uq_interviews_interviewer_slot" ON "interviews" ("interviewer_admin_id", "scheduled_at") WHERE "status" = 'scheduled';
ALTER TABLE "interviews" ADD CONSTRAINT "chk_interviews_duration" CHECK ("duration_minutes" BETWEEN 15 AND 240);
ALTER TABLE "schedule_invites" ADD CONSTRAINT "chk_schedule_invites_duration" CHECK ("duration_minutes" BETWEEN 15 AND 240);
ALTER TABLE "schedule_invites" ADD CONSTRAINT "chk_schedule_invites_window" CHECK ("window_end" > "window_start");
