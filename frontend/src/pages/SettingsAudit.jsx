import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { axiosClient } from '../api/axiosClient';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import FormField from '../components/ui/FormField';
import { SkeletonText } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';

const ACTION_VARIANT = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
  ACTIVATE: 'success',
  DEACTIVATE: 'warning',
  LOGIN: 'neutral',
  PASSWORD_CHANGE: 'primary',
};

// Every entity name actually passed to AuditLogService.log(...) anywhere
// in the backend, so this dropdown reflects real data rather than a
// guessed subset - kept manually in sync since audit action types are
// added rarely enough that a build-time constant isn't worth adding.
const ENTITY_TYPES = [
  'Candidate', 'Department', 'Designation', 'Device', 'Employee', 'Goal', 'Holiday',
  'Interview', 'JobOpening', 'LeaveRequest', 'LeaveType', 'PayrollItem', 'PayrollRun',
  'PerformanceReview', 'Role', 'SalaryStructure', 'Team', 'User',
];

export default function SettingsAudit() {
  const [page, setPage] = useState(0);
  const [entityName, setEntityName] = useState('');
  const pageSize = 25;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', page, entityName],
    queryFn: () =>
      axiosClient
        .get('/api/audit/logs', { params: { page, size: pageSize, entityName: entityName || undefined } })
        .then((res) => res.data),
  });

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  function handleEntityChange(value) {
    setEntityName(value);
    setPage(0); // a new filter starts back at page 1 - stale offsets into a different result set make no sense
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-end justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Audit Logs</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Every create, update, activation, and login event across the platform
          </p>
        </div>
        <div style={{ width: 220 }}>
          <FormField as="select" label="Entity" value={entityName} onChange={handleEntityChange}>
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </FormField>
        </div>
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={6} />
          </div>
        )}

        {isError && <ErrorState description="Couldn't load audit logs." onRetry={refetch} />}

        {!isLoading && !isError && data?.content?.length === 0 && (
          <EmptyState
            title={entityName ? 'No matching activity' : 'No activity yet'}
            description={entityName ? `No ${entityName} events recorded.` : 'Actions taken across HaodaOne will show up here as they happen.'}
          />
        )}

        {!isLoading && !isError && data?.content?.length > 0 && (
          <>
            <table className="table mb-0 align-middle">
              <thead>
                <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
                  <th className="ps-4">When</th>
                  <th>Entity</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th className="pe-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((log) => (
                  <tr key={log.id}>
                    <td className="ps-4" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                      {new Date(log.performedAt).toLocaleString()}
                    </td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>
                      {log.entityName} #{log.entityId}
                    </td>
                    <td>
                      <Badge variant={ACTION_VARIANT[log.action] || 'neutral'}>{log.action}</Badge>
                    </td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{log.performedBy}</td>
                    <td className="pe-4" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderTop: '1px solid var(--hz-border)' }}>
              <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>
                {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalElements)} of {totalElements}
              </span>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="hz-icon-btn d-flex align-items-center justify-content-center border-0"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                  Page {page + 1} of {Math.max(totalPages, 1)}
                </span>
                <button
                  type="button"
                  className="hz-icon-btn d-flex align-items-center justify-content-center border-0"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
