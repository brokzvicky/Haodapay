-- =====================================================================
-- V3__revert_employment_status_casing.sql
--
-- V1__align_with_haoda_asset_shared_schema.sql normalized
-- employee.employment_status into an ACTIVE/ON_LEAVE/NOTICE_PERIOD/
-- RESIGNED/TERMINATED vocabulary. That column is shared with HaodaAsset,
-- which writes and reads it in Title Case ("Active", "On Leave",
-- "Notice Period", "Resigned", "Terminated" - see
-- com.vikkash.assetmanagementv1.entity.EmploymentStatus) and never writes
-- an all-caps value itself. Rewriting existing rows to uppercase broke
-- HaodaAsset in place:
--   * EmployeeRepository's "WHERE e.employmentStatus = 'Resigned'" (and
--     the equivalent 'Terminated' query) stopped matching rewritten rows.
--   * EmployeeEmploymentStatusMigration's login_enabled backfill, which
--     runs on every HaodaAsset startup, compares against the exact
--     strings "Resigned"/"Terminated" - a row holding "RESIGNED" no
--     longer matches, so that runner would re-enable login for someone
--     who has actually left.
--
-- This is a corrective, one-time, idempotent revert: only rows holding
-- exactly one of the 5 uppercase values V1 could have produced are
-- touched, restoring HaodaAsset's original casing. HaodaOne's code has
-- been updated (see employee.entity.EmploymentStatus) to read/write this
-- same Title Case vocabulary going forward, so this column never needs
-- to be rewritten again.
-- =====================================================================

UPDATE public.employee SET employment_status = 'Active'        WHERE employment_status = 'ACTIVE';
UPDATE public.employee SET employment_status = 'On Leave'      WHERE employment_status = 'ON_LEAVE';
UPDATE public.employee SET employment_status = 'Notice Period' WHERE employment_status = 'NOTICE_PERIOD';
UPDATE public.employee SET employment_status = 'Resigned'      WHERE employment_status = 'RESIGNED';
UPDATE public.employee SET employment_status = 'Terminated'    WHERE employment_status = 'TERMINATED';
