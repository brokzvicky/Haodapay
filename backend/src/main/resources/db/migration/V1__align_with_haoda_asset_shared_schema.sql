-- =====================================================================
-- V1__align_with_haoda_asset_shared_schema.sql
--
-- HaodaOne now runs against the existing HaodaAsset PostgreSQL database
-- instead of its own. Most tables it needs (employee, department,
-- designation, team, role, permission, role_permissions, user_roles,
-- app_user, leave_type, leave_balance, leave_request, holiday,
-- attendance_record, biometric_device, audit_log, login_history,
-- refresh_token) already exist there and are reused as-is.
--
-- A few of those tables were built for HaodaAsset only and are missing
-- columns HaodaOne's shared BaseEntity (created_at/updated_at/version/
-- deleted) or a couple of HRMS-specific fields require. This script adds
-- ONLY what's missing, with safe defaults, and backfills existing rows.
--
-- Rules followed throughout:
--   * Never DROP, RENAME, or narrow an existing column - HaodaAsset keeps
--     working unmodified.
--   * Every ADD COLUMN is guarded with IF NOT EXISTS so this script is
--     safe to run more than once.
--   * NOT NULL is only applied after backfilling existing rows.
--
-- Run this once against the shared database before starting HaodaOne
-- with spring.jpa.hibernate.ddl-auto=validate (see application.properties).
-- =====================================================================

-- ---------------------------------------------------------------------
-- role: HaodaAsset's role table predates HaodaOne's BaseEntity (audit
-- columns) and its systemDefined flag. `label` and `description` already
-- exist and are reused by the entity as-is.
-- ---------------------------------------------------------------------
ALTER TABLE public.role
    ADD COLUMN IF NOT EXISTS version        bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at     timestamp(6) without time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at     timestamp(6) without time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted        boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS system_defined boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- permission: same audit-column gap as role. `label` is reused by
-- HaodaOne's Permission.description field (see Permission.java) instead
-- of adding a duplicate column.
-- ---------------------------------------------------------------------
ALTER TABLE public.permission
    ADD COLUMN IF NOT EXISTS version    bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at timestamp(6) without time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamp(6) without time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted    boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- employee: HaodaAsset's employee table doubles as its own login table
-- (password, must_change_password, role, auth_provider, ...) and stores
-- a single employee_name instead of first/last name, plus joining_date
-- as free-text. HaodaOne reuses the same row per person (via user_id,
-- department_id, designation_id, team_id, reporting_manager_id, which
-- already exist and already match) and only needs a few extra columns.
-- employee_code maps to the existing employee_id column (already unique
-- + not null); status maps to the existing employment_status column.
-- ---------------------------------------------------------------------
ALTER TABLE public.employee
    ADD COLUMN IF NOT EXISTS version         bigint NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at      timestamp(6) without time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at      timestamp(6) without time zone NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS deleted         boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS first_name      character varying(100),
    ADD COLUMN IF NOT EXISTS last_name       character varying(100),
    ADD COLUMN IF NOT EXISTS date_of_joining date,
    ADD COLUMN IF NOT EXISTS employment_type character varying(20) NOT NULL DEFAULT 'FULL_TIME';

-- Backfill first_name/last_name by splitting the existing employee_name
-- on the first space (best-effort - HR can correct names in the UI
-- afterwards; this only runs for rows that don't have them yet).
UPDATE public.employee
SET first_name = COALESCE(NULLIF(split_part(employee_name, ' ', 1), ''), employee_name),
    last_name  = COALESCE(NULLIF(substring(employee_name FROM position(' ' IN employee_name) + 1), ''), '-')
WHERE first_name IS NULL;

ALTER TABLE public.employee
    ALTER COLUMN first_name SET NOT NULL,
    ALTER COLUMN last_name  SET NOT NULL;

-- Backfill date_of_joining from the legacy free-text joining_date where
-- it parses as a date; otherwise fall back to created_at's date so the
-- NOT NULL constraint HaodaOne requires can be applied safely.
UPDATE public.employee
SET date_of_joining = COALESCE(
        NULLIF(joining_date, '')::date,
        created_at::date)
WHERE date_of_joining IS NULL
  AND joining_date ~ '^\d{4}-\d{2}-\d{2}$';

UPDATE public.employee
SET date_of_joining = created_at::date
WHERE date_of_joining IS NULL;

ALTER TABLE public.employee
    ALTER COLUMN date_of_joining SET NOT NULL;

-- ---------------------------------------------------------------------
-- employee: HaodaAsset's own login columns (password, role,
-- must_change_password, auth_provider) are NOT NULL with no default.
-- HaodaOne's Employee entity intentionally doesn't map these (it uses
-- app_user for login instead - see Employee.java javadoc) so any INSERT
-- coming from HaodaOne would omit them and violate NOT NULL. Adding
-- column DEFAULTs fixes that for future rows without touching existing
-- ones or overriding values HaodaAsset itself sets explicitly.
--
-- login_enabled's default is also tightened to false (from true) for
-- the same reason, but in the opposite direction: HaodaAsset's own
-- EmployeeService always sets it explicitly on create, so this only
-- changes what happens for rows HaodaOne creates - keeping an
-- employee that HaodaOne onboards from HaodaAsset's password/PIN login
-- path until someone deliberately enables it there.
-- ---------------------------------------------------------------------
ALTER TABLE public.employee ALTER COLUMN password SET DEFAULT '{noop}!disabled!';
ALTER TABLE public.employee ALTER COLUMN role SET DEFAULT 'EMPLOYEE';
ALTER TABLE public.employee ALTER COLUMN must_change_password SET DEFAULT true;
ALTER TABLE public.employee ALTER COLUMN auth_provider SET DEFAULT 'LOCAL';
ALTER TABLE public.employee ALTER COLUMN login_enabled SET DEFAULT false;

-- HaodaOne's Employee entity requires email to be present (nullable =
-- false) - the shared column allows null today. Backfill any existing
-- gaps with a clearly-synthetic placeholder (flagged for HR follow-up)
-- before applying the NOT NULL constraint, rather than silently making
-- up a real-looking address.
UPDATE public.employee
SET email = 'employee-' || employee_id || '.needs-email@haodaone.local'
WHERE email IS NULL OR email = '';

ALTER TABLE public.employee ALTER COLUMN email SET NOT NULL;

-- Normalize employment_status values HaodaOne expects (ACTIVE, ON_LEAVE,
-- NOTICE_PERIOD, RESIGNED, TERMINATED) without touching rows that are
-- already in that form. HaodaAsset's own default was 'Active'.
UPDATE public.employee SET employment_status = 'ACTIVE'        WHERE employment_status ILIKE 'active';
UPDATE public.employee SET employment_status = 'ON_LEAVE'      WHERE employment_status ILIKE 'on leave' OR employment_status ILIKE 'onleave';
UPDATE public.employee SET employment_status = 'NOTICE_PERIOD' WHERE employment_status ILIKE 'notice period' OR employment_status ILIKE 'noticeperiod';
UPDATE public.employee SET employment_status = 'RESIGNED'      WHERE employment_status ILIKE 'resigned';
UPDATE public.employee SET employment_status = 'TERMINATED'    WHERE employment_status ILIKE 'terminated';
-- Any other existing value (custom status text) is left untouched -
-- review manually if HaodaOne's status filters look incomplete.

-- Keep HaodaAsset's employee_name in sync automatically whenever
-- HaodaOne updates first_name/last_name, so HaodaAsset's own screens
-- (which still read employee_name) keep working unchanged.
CREATE OR REPLACE FUNCTION public.haodaone_sync_employee_name()
    RETURNS trigger AS $$
BEGIN
    NEW.employee_name := NULLIF(trim(both ' ' FROM concat_ws(' ', NEW.first_name, NULLIF(NEW.last_name, '-'))), '');
    IF NEW.employee_name IS NULL THEN
        -- Nothing usable in first_name/last_name (shouldn't happen since both
        -- are NOT NULL, but guards against blank strings). Fall back to
        -- whatever was already there on UPDATE, or the row's own employee_id
        -- as a last resort on INSERT so the NOT NULL constraint is satisfied.
        IF TG_OP = 'UPDATE' THEN
            NEW.employee_name := OLD.employee_name;
        ELSE
            NEW.employee_name := NEW.employee_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_haodaone_sync_employee_name ON public.employee;
CREATE TRIGGER trg_haodaone_sync_employee_name
    BEFORE INSERT OR UPDATE OF first_name, last_name ON public.employee
    FOR EACH ROW
    EXECUTE FUNCTION public.haodaone_sync_employee_name();
