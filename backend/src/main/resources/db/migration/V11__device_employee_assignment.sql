-- =====================================================================
-- V11__device_employee_assignment.sql
--
-- Extends monitored_device with the fields the Device Assignment module
-- needs on top of what V10 already gave us (device_name, mac_address,
-- employee_id, active/status): hostname, serial_number, assigned_date and
-- machine_guid (the agent's stable per-install GUID, distinct from
-- device_id which is the hardware-derived id already stored). Nothing
-- existing is renamed or dropped, same convention as V9/V10.
-- =====================================================================

ALTER TABLE public.monitored_device
    ADD COLUMN IF NOT EXISTS hostname       character varying(150),
    ADD COLUMN IF NOT EXISTS serial_number  character varying(150),
    ADD COLUMN IF NOT EXISTS assigned_date  date,
    ADD COLUMN IF NOT EXISTS machine_guid   character varying(100);

-- Powers the Device Assignment table's search-by-serial and lets the agent
-- registration path detect a serial-number collision across two enrollments.
CREATE INDEX IF NOT EXISTS idx_monitored_device_serial_number ON public.monitored_device (serial_number);
CREATE INDEX IF NOT EXISTS idx_monitored_device_machine_guid ON public.monitored_device (machine_guid);

-- Backfill: existing enrolled devices had no assigned_date; default it to
-- their creation date so pre-existing rows show a sane value in the new
-- Device Assignment table instead of a blank column.
UPDATE public.monitored_device SET assigned_date = created_at::date WHERE assigned_date IS NULL;
