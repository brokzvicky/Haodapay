-- V15: Seed initial subscription rows using company_name lookup (staging-safe)
-- Inserts a TRIAL / ACTIVE subscription for HaodaPay if the company exists and
-- no non-deleted subscription already exists for that company.
-- This migration is safe to run in staging; do NOT run against production without review.

INSERT INTO subscription (company_id, plan, status, employee_limit, device_limit, start_date, renewal_date, amount, deleted, created_at, updated_at)
SELECT c.id, 'TRIAL', 'ACTIVE', 100, 100, DATE '2026-08-24', DATE '2026-09-23', 0.00, false, now(), now()
FROM company c
WHERE c.name = 'HaodaPay'
  AND NOT EXISTS (
    SELECT 1 FROM subscription s WHERE s.company_id = c.id AND s.deleted = false
  );
