-- Demo/local-dev data for the Peak Process Partners onboarding schema.
-- Run AFTER schema.sql. Safe to re-run: it deletes its own three demo rows
-- first (matched by fixed UUIDs below), so re-seeding never duplicates rows.
--
-- NOTE on Aadhaar / PAN / UAN: those columns store AES-256-GCM ciphertext
-- produced by lib/security/encryption.ts (see write-up). Plain SQL cannot
-- produce valid ciphertext without the app's ENCRYPTION_KEY, so this file
-- intentionally leaves them NULL. For demo data that includes realistic
-- (fake) encrypted government IDs, use `npx prisma db seed`
-- (prisma/seed.ts), which calls the real encryption helper before insert.
--
-- NOTE on `id` columns below: every row provides its id explicitly rather
-- than relying on the tables' `DEFAULT (UUID())`. Verified against a real
-- MariaDB 10.4 server that that default silently evaluates to an empty
-- string (not a fresh UUID per row) inside a multi-row
-- `INSERT ... VALUES (...), (...)` statement, which then fails on the
-- primary key. The app itself never hits this — Prisma generates each id
-- client-side, one row at a time — but hand-written multi-row seed SQL
-- does, so it's worked around here for portability across engines/versions.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM employee_documents          WHERE employee_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM health_insurance_dependents WHERE employee_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
DELETE FROM health_insurance            WHERE employee_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM emergency_contacts          WHERE employee_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM employee_references         WHERE employee_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM personal_information        WHERE employee_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
DELETE FROM employees                   WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Employee 1 — Priya Sharma — fully complete and submitted.
-- Exercises the "review & submit" / completion-screen path.
-- ----------------------------------------------------------------------------
INSERT INTO employees (id, session_token, full_name, status, submission_reference, submitted_at, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Priya Sharma',
    'submitted',
    'PPP-DEMO0001',
    '2026-09-10 09:45:00.000',
    '2026-09-10 09:10:00.000'
);

INSERT INTO personal_information (employee_id, first_name, last_name, date_of_birth, gender, personal_email, phone, home_address)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Priya', 'Sharma', '1998-04-12', 'female',
    'priya.sharma@example.com', '+91 98765 43210',
    '221B Residency Road, Bengaluru, Karnataka, 560025'
);

INSERT INTO employee_references (id, employee_id, reference_type, name, relationship, company, email, phone) VALUES
    ('11111111-1111-1111-1111-100000000001', '11111111-1111-1111-1111-111111111111', 'primary',   'Rahul Mehta', 'Former Manager',   'Initech', 'rahul.mehta@example.com', '+91 91234 56780'),
    ('11111111-1111-1111-1111-100000000002', '11111111-1111-1111-1111-111111111111', 'secondary', 'Anita Rao',   'Senior Colleague', 'Initech', 'anita.rao@example.com',   '+91 91234 56781');

INSERT INTO emergency_contacts (employee_id, name, relationship, primary_phone, same_as_home_address, address)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Sunita Sharma', 'Mother', '+91 99887 76655', TRUE, NULL
);

INSERT INTO health_insurance (employee_id, coverage_type, nominee_name, nominee_relationship)
VALUES (
    '11111111-1111-1111-1111-111111111111', 'self-spouse', 'Karan Sharma', 'Spouse'
);

INSERT INTO health_insurance_dependents (id, employee_id, name, relationship, date_of_birth)
VALUES (
    '11111111-1111-1111-1111-300000000001', '11111111-1111-1111-1111-111111111111', 'Karan Sharma', 'Spouse', '1997-02-20'
);

INSERT INTO employee_documents (id, employee_id, document_type, file_name, file_size, mime_type, status, uploaded_at) VALUES
    ('11111111-1111-1111-1111-200000000001', '11111111-1111-1111-1111-111111111111', 'identityProof', 'priya_aadhaar.pdf', 184320, 'application/pdf', 'uploaded', '2026-09-10 09:20:00.000'),
    ('11111111-1111-1111-1111-200000000002', '11111111-1111-1111-1111-111111111111', 'addressProof',  'priya_utility_bill.pdf', 152040, 'application/pdf', 'uploaded', '2026-09-10 09:21:00.000'),
    ('11111111-1111-1111-1111-200000000003', '11111111-1111-1111-1111-111111111111', 'resume',        'priya_resume.pdf', 98304, 'application/pdf', 'uploaded', '2026-09-10 09:22:00.000'),
    ('11111111-1111-1111-1111-200000000004', '11111111-1111-1111-1111-111111111111', 'offerLetter',   'Offer_Letter_PeakProcessPartners.pdf', 0, 'application/pdf', 'provided', '2026-09-10 09:10:00.000');

-- ----------------------------------------------------------------------------
-- Employee 2 — Rahul Verma — mid-flow: personal info + references done,
-- emergency contact half-filled, nothing beyond that. Exercises the
-- "blocked"/"in progress" step states and partial-row NULLs.
-- ----------------------------------------------------------------------------
INSERT INTO employees (id, session_token, full_name, status, created_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'Rahul Verma',
    'in_progress',
    '2026-09-15 14:00:00.000'
);

INSERT INTO personal_information (employee_id, first_name, last_name, date_of_birth, gender, personal_email, phone, home_address)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Rahul', 'Verma', '1995-11-02', 'male',
    'rahul.verma@example.com', '+91 90000 11122',
    '14 MG Road, Pune, Maharashtra, 411001'
);

INSERT INTO employee_references (id, employee_id, reference_type, name, relationship, company, email, phone) VALUES
    ('22222222-2222-2222-2222-100000000001', '22222222-2222-2222-2222-222222222222', 'primary', 'Devika Nair', 'Former Manager', 'Contoso', 'devika.nair@example.com', '+91 90000 22233');
-- secondary reference intentionally omitted — step still in progress

INSERT INTO emergency_contacts (employee_id, name, relationship, same_as_home_address)
VALUES (
    '22222222-2222-2222-2222-222222222222', 'Meena Verma', 'Mother', FALSE
);
-- primary_phone / address left NULL — matches an incomplete step in the UI

-- ----------------------------------------------------------------------------
-- Employee 3 — Ananya Iyer — just started: only the Welcome step is done.
-- Exercises the "everything else is upcoming/not started" state.
-- ----------------------------------------------------------------------------
INSERT INTO employees (id, session_token, full_name, status, created_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'Ananya Iyer',
    'in_progress',
    '2026-09-20 11:30:00.000'
);
