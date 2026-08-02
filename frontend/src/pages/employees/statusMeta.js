export const STATUS_META = {
  ACTIVE: { label: 'Active', variant: 'success' },
  ON_LEAVE: { label: 'On Leave', variant: 'warning' },
  NOTICE_PERIOD: { label: 'Notice Period', variant: 'warning' },
  RESIGNED: { label: 'Resigned', variant: 'neutral' },
  TERMINATED: { label: 'Terminated', variant: 'danger' },
};

export const EMPLOYMENT_TYPE_LABEL = {
  FULL_TIME: 'Full-Time',
  PART_TIME: 'Part-Time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export function statusMeta(status) {
  return STATUS_META[status] || { label: status, variant: 'neutral' };
}
