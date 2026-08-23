ALTER TABLE public.job_opening
    ADD COLUMN IF NOT EXISTS closed_reason character varying(80),
    ADD COLUMN IF NOT EXISTS closed_comments character varying(1000),
    ADD COLUMN IF NOT EXISTS closed_by character varying(100),
    ADD COLUMN IF NOT EXISTS closed_at timestamp(6) without time zone;