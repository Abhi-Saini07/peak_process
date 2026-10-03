-- RenameIndex
ALTER INDEX "employees_source_application_id_key" RENAME TO "uq_employees_source_application";

-- RenameIndex
ALTER INDEX "job_applications_employee_id_key" RENAME TO "uq_job_applications_employee";

-- RenameIndex
ALTER INDEX "onboarding_invites_token_hash_key" RENAME TO "uq_onboarding_invites_token_hash";


-- Offer details and the time they were sent are always written together.
ALTER TABLE "job_applications" ADD CONSTRAINT "chk_job_applications_offer_pair"
  CHECK (("offer_details" IS NULL) = ("offer_sent_at" IS NULL));
-- Only a hired ("selected") application can point at an Employee.
ALTER TABLE "job_applications" ADD CONSTRAINT "chk_job_applications_employee_hired"
  CHECK ("employee_id" IS NULL OR "status" = 'selected');
