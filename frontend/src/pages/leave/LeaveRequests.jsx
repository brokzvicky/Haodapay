import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarPlus, Check, X as XIcon, Calendar } from 'lucide-react';
import { leaveRequestsApi } from '../../api/endpoints/leave';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonText } from '../../components/ui/Skeleton';
import ApplyLeaveModal from './ApplyLeaveModal';
import { leaveStatusMeta } from './leaveStatusMeta';
import { useAuth } from '../../hooks/useAuth';

const TABS = [
  { key: 'PENDING', label: 'Pending Approval' },
  { key: '', label: 'All Requests' },
];

export default function LeaveRequests() {
  const [tab, setTab] = useState('PENDING');
  const [showApply, setShowApply] = useState(false);
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  // A Manager (LEAVE_APPROVE without the broader LEAVE_MANAGE HR/Admin
  // hold) should only see their own team's requests here - the plain
  // listAll endpoint is org-wide and gated on LEAVE_VIEW, which MANAGER
  // also has, so calling it directly would show every employee's leave
  // company-wide. Same distinction already used for the Dashboard's My
  // Team widget, applied here since this page is the one people actually
  // use day-to-day.
  const isTeamScoped = hasPermission('LEAVE_APPROVE') && !hasPermission('LEAVE_MANAGE');

  const { data: requests, isLoading, isError, refetch } = useQuery({
    queryKey: ['leave-requests', tab, isTeamScoped],
    queryFn: () => (isTeamScoped ? leaveRequestsApi.teamList(tab || undefined) : leaveRequestsApi.list(tab || undefined)),
  });

  const decide = useMutation({
    mutationFn: ({ id, approve }) => (approve ? leaveRequestsApi.approve(id) : leaveRequestsApi.reject(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-my-team'] });
    },
  });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Leave</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            {isTeamScoped ? "Your team's requests, approvals, and balances" : 'Requests, approvals, and balances'}
          </p>
        </div>
        <Button icon={CalendarPlus} onClick={() => setShowApply(true)}>
          Apply Leave
        </Button>
      </div>

      <div className="d-flex gap-2" style={{ borderBottom: '1px solid var(--hz-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn border-0 rounded-0 px-3 py-2"
            style={{
              fontSize: 'var(--hz-text-sm)',
              fontWeight: 600,
              color: tab === t.key ? 'var(--hz-primary-700)' : 'var(--hz-text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--hz-primary-600)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={6} />
          </div>
        )}

        {isError && <ErrorState description="Couldn't load leave requests." onRetry={refetch} />}

        {!isLoading && !isError && requests?.length === 0 && (
          <EmptyState
            icon={Calendar}
            title={tab === 'PENDING' ? 'Nothing pending' : 'No leave requests yet'}
            description={
              tab === 'PENDING'
                ? isTeamScoped
                  ? 'None of your direct reports have pending requests.'
                  : 'New requests will show up here for approval.'
                : 'Apply for leave to get started.'
            }
          />
        )}

        {!isLoading && !isError && requests?.length > 0 && (
          <table className="table mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
                <th className="ps-4">Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const meta = leaveStatusMeta(r.status);
                return (
                  <tr key={r.id}>
                    <td className="ps-4">
                      <Link to={`/employees/${r.employeeId}`} className="d-flex align-items-center gap-2 text-decoration-none">
                        <Avatar name={r.employeeName} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>{r.employeeName}</div>
                          <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{r.departmentName || '—'}</div>
                        </div>
                      </Link>
                    </td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{r.leaveTypeName}</td>
                    <td style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                      {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td style={{ fontSize: 'var(--hz-text-sm)' }}>{r.days}</td>
                    <td>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="pe-4 text-end">
                      {r.status === 'PENDING' && (
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-sm btn-light border-0"
                            style={{ color: 'var(--hz-success-600)' }}
                            onClick={() => decide.mutate({ id: r.id, approve: true })}
                            disabled={decide.isPending}
                            aria-label={`Approve ${r.employeeName}'s leave request`}
                          >
                            <Check size={15} />
                          </button>
                          <button
                            className="btn btn-sm btn-light border-0"
                            style={{ color: 'var(--hz-danger-600)' }}
                            onClick={() => decide.mutate({ id: r.id, approve: false })}
                            disabled={decide.isPending}
                            aria-label={`Reject ${r.employeeName}'s leave request`}
                          >
                            <XIcon size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {showApply && <ApplyLeaveModal onClose={() => setShowApply(false)} />}
    </div>
  );
}
