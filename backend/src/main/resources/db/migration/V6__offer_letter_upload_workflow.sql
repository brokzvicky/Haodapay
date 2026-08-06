-- =====================================================================
-- V6__offer_letter_upload_workflow.sql
--
-- Replaces the old "generate offer -> auto-email offer letter" flow with
-- an explicit upload-then-send step: HR must upload a signed offer
-- letter document (PDF/DOC/DOCX, stored in S3 - see
-- OfferLetterS3StorageService) before it can be emailed to the
-- candidate. Adds the OFFER_LETTER_SENT stage between OFFERED and
-- OFFER_ACCEPTED - see Candidate's class doc for the full pipeline.
-- =====================================================================

ALTER TABLE public.candidate
    ADD COLUMN IF NOT EXISTS offer_letter_file_key      VARCHAR(300),
    ADD COLUMN IF NOT EXISTS offer_letter_original_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS offer_letter_uploaded_at    TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS offer_letter_uploaded_by    VARCHAR(150),
    ADD COLUMN IF NOT EXISTS offer_letter_sent_at        TIMESTAMP(6),
    ADD COLUMN IF NOT EXISTS offer_letter_email_status   VARCHAR(20);
