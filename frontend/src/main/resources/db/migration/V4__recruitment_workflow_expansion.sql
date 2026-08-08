-- =====================================================================
-- V4__recruitment_workflow_expansion.sql
--
-- Extends the existing candidate/interview tables (introduced in V2,
-- exclusive to HaodaOne - not shared with HaodaAsset, so this is a
-- normal additive migration with no cross-app risk) to support the full
-- ATS workflow: application intake with resume + experience/skills,
-- HR screening review (rating/remarks/optional rejection reason),
-- numbered interview rounds, and offer generation/acceptance tracking
-- through to auto-onboarding.
-- =====================================================================

ALTER TABLE public.candidate
    ADD COLUMN IF NOT EXISTS experience_years   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS skills             VARCHAR(500),
    ADD COLUMN IF NOT EXISTS rating             INTEGER,
    ADD COLUMN IF NOT EXISTS remarks            VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS rejection_reason    VARCHAR(500),
    ADD COLUMN IF NOT EXISTS resume_file_key     VARCHAR(300),
    ADD COLUMN IF NOT EXISTS resume_original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS offer_generated_at  TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS offer_accepted_at   TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS created_employee_id BIGINT;

ALTER TABLE public.interview
    ADD COLUMN IF NOT EXISTS round_number INTEGER,
    ADD COLUMN IF NOT EXISTS round_type   VARCHAR(30);

-- Backfill round_number for any interview rows that predate this column
-- (the earlier version of this module only ever scheduled one generic
-- interview per candidate) so existing data still satisfies the
-- application-level "1/2/3" expectations going forward.
UPDATE public.interview SET round_number = 1, round_type = 'HR_INTERVIEW' WHERE round_number IS NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_created_employee_id ON public.candidate (created_employee_id);
