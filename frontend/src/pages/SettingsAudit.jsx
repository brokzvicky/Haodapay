import { useQuery } from '@tanstack/react-query';
import { axiosClient } from '../api/axiosClient';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
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

export default function SettingsAudit() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => axiosClient.get('/api/audit/logs?size=50').then((res) => res.data),
  });

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Audit Logs</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Every create, update, activation, and login event across the platform
        </p>
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={6} />
          </div>
        )}

        {isError && <ErrorState description="Couldn't load audit logs." onRetry={refetch} />}

        {!isLoading && !isError && data?.content?.length === 0 && (
          <EmptyState title="No activity yet" description="Actions taken across HaodaOne will show up here as they happen." />
        )}

        {!isLoading && !isError && data?.content?.length > 0 && (
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
        )}
      </Card>
    </div>
  );
}
