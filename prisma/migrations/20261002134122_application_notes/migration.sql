-- CreateTable
CREATE TABLE "application_notes" (
    "id" CHAR(36) NOT NULL,
    "application_id" CHAR(36) NOT NULL,
    "author_admin_id" CHAR(36),
    "body" TEXT NOT NULL,
    "rating" SMALLINT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_application_notes_application_created" ON "application_notes"("application_id", "created_at");

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_author_admin_id_fkey" FOREIGN KEY ("author_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ratings are optional, 1–5 (see ApplicationNote in schema.prisma).
ALTER TABLE "application_notes" ADD CONSTRAINT "chk_application_notes_rating" CHECK ("rating" IS NULL OR "rating" BETWEEN 1 AND 5);
