-- CreateTable
CREATE TABLE `employees` (
    `id` CHAR(36) NOT NULL,
    `session_token` CHAR(36) NOT NULL,
    `full_name` VARCHAR(255) NULL,
    `status` ENUM('in_progress', 'submitted') NOT NULL DEFAULT 'in_progress',
    `submission_reference` VARCHAR(32) NULL,
    `submitted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_session_token_key`(`session_token`),
    UNIQUE INDEX `employees_submission_reference_key`(`submission_reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `personal_information` (
    `employee_id` CHAR(36) NOT NULL,
    `first_name` VARCHAR(100) NULL,
    `last_name` VARCHAR(100) NULL,
    `date_of_birth` DATE NULL,
    `gender` ENUM('female', 'male', 'non-binary', 'prefer-not-to-say') NULL,
    `personal_email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `home_address` VARCHAR(500) NULL,
    `aadhaar_number_enc` VARBINARY(255) NULL,
    `pan_number_enc` VARBINARY(255) NULL,
    `uan_number_enc` VARBINARY(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_references` (
    `id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `reference_type` ENUM('primary', 'secondary') NOT NULL,
    `name` VARCHAR(150) NULL,
    `relationship` VARCHAR(100) NULL,
    `company` VARCHAR(150) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_employee_references_employee`(`employee_id`),
    UNIQUE INDEX `uq_employee_references_type`(`employee_id`, `reference_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `employee_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NULL,
    `relationship` VARCHAR(100) NULL,
    `primary_phone` VARCHAR(20) NULL,
    `secondary_phone` VARCHAR(20) NULL,
    `same_as_home_address` BOOLEAN NOT NULL DEFAULT false,
    `address` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_insurance` (
    `employee_id` CHAR(36) NOT NULL,
    `coverage_type` ENUM('self', 'self-spouse', 'self-family') NULL,
    `nominee_name` VARCHAR(150) NULL,
    `nominee_relationship` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `health_insurance_dependents` (
    `id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `relationship` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_health_insurance_dependents_employee`(`employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_documents` (
    `id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `document_type` ENUM('identityProof', 'addressProof', 'resume', 'educationalCertificates', 'offerLetter') NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size` INTEGER UNSIGNED NULL,
    `mime_type` VARCHAR(127) NULL,
    `storage_path` VARCHAR(1024) NULL,
    `status` ENUM('pending', 'uploading', 'uploaded', 'error', 'provided') NOT NULL DEFAULT 'pending',
    `error_message` VARCHAR(500) NULL,
    `uploaded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_employee_documents_employee`(`employee_id`),
    UNIQUE INDEX `uq_employee_documents_type`(`employee_id`, `document_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `personal_information` ADD CONSTRAINT `personal_information_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_references` ADD CONSTRAINT `employee_references_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_insurance` ADD CONSTRAINT `health_insurance_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `health_insurance_dependents` ADD CONSTRAINT `health_insurance_dependents_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `health_insurance`(`employee_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_documents` ADD CONSTRAINT `employee_documents_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraints
-- Prisma's schema DSL (as of 6.x) has no first-class way to express CHECK
-- constraints, so they're hand-appended here to match db/schema.sql exactly.
-- See that file's comments for what each one guards against.
ALTER TABLE `employees` ADD CONSTRAINT `chk_employees_submitted_consistency` CHECK (
    (status = 'submitted' AND submitted_at IS NOT NULL AND submission_reference IS NOT NULL)
    OR
    (status = 'in_progress' AND submitted_at IS NULL AND submission_reference IS NULL)
);

ALTER TABLE `personal_information` ADD CONSTRAINT `chk_personal_information_email` CHECK (
    personal_email IS NULL OR personal_email REGEXP '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'
);
ALTER TABLE `personal_information` ADD CONSTRAINT `chk_personal_information_phone` CHECK (
    phone IS NULL OR phone REGEXP '^\\+?[0-9 -]{10,15}$'
);

ALTER TABLE `employee_references` ADD CONSTRAINT `chk_employee_references_email` CHECK (
    email IS NULL OR email REGEXP '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'
);
ALTER TABLE `employee_references` ADD CONSTRAINT `chk_employee_references_phone` CHECK (
    phone IS NULL OR phone REGEXP '^\\+?[0-9 -]{10,15}$'
);

ALTER TABLE `emergency_contacts` ADD CONSTRAINT `chk_emergency_contacts_phone` CHECK (
    primary_phone IS NULL OR primary_phone REGEXP '^\\+?[0-9 -]{10,15}$'
);
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `chk_emergency_contacts_secondary_phone` CHECK (
    secondary_phone IS NULL OR secondary_phone REGEXP '^\\+?[0-9 -]{10,15}$'
);
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `chk_emergency_contacts_address` CHECK (
    same_as_home_address = TRUE OR address IS NULL OR CHAR_LENGTH(TRIM(address)) >= 10
);

ALTER TABLE `employee_documents` ADD CONSTRAINT `chk_employee_documents_uploaded` CHECK (
    status NOT IN ('uploaded', 'provided') OR (file_name IS NOT NULL AND uploaded_at IS NOT NULL)
);
