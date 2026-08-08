-- =====================================================================
-- V5__manager_interview_assignment.sql
--
-- Supports the Manager Interview Assignment workflow: when HR selects a
-- candidate for the manager round, they schedule a specific interview
-- (round_number = 2) with a meeting link, and the assigned manager later
-- records a technical/communication/overall rating split (rather than
-- the single generic "rating" the HR round used) plus a per-round
-- decision. The same decision column is reused by round 3 (Final).
--
-- interview is exclusive to HaodaOne (introduced in V2, extended in V4) -
-- not shared with HaodaAsset - so this is a normal additive migration.
-- =====================================================================

ALTER TABLE public.interview
    ADD COLUMN IF NOT EXISTS meeting_link         VARCHAR(500),
    ADD COLUMN IF NOT EXISTS technical_rating      INTEGER,
    ADD COLUMN IF NOT EXISTS communication_rating  INTEGER,
    ADD COLUMN IF NOT EXISTS instructions          VARCHAR(1000),
    -- Per-round decision the interviewer records alongside their
    -- rating/feedback: REJECTED, SELECT_FOR_FINAL (round 2 only), or
    -- APPROVED_FOR_OFFER (round 3 only). Distinct from candidate.stage,
    -- which is the pipeline position; this is what this particular
    -- interview's outcome was, kept for the permanent interview history.
    ADD COLUMN IF NOT EXISTS decision              VARCHAR(30);
