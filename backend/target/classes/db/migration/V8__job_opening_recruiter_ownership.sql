-- =====================================================================
-- V8__job_opening_recruiter_ownership.sql
--
-- Adds an optional owning recruiter to each job opening. Nothing in the
-- schema previously captured "who is running this requisition" - every
-- requisition-scoped view (a Recruiter persona dashboard, "my open reqs")
-- had no way to filter down from the whole company's postings. Nullable
-- and additive: existing job openings simply have no recruiter assigned
-- until someone sets one, nothing about opening/candidate/interview
-- creation changes.
-- =====================================================================

ALTER TABLE public.job_opening
    ADD COLUMN IF NOT EXISTS recruiter_id BIGINT REFERENCES public.employee(id);
