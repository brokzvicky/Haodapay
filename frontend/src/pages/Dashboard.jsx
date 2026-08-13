import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarOff, FileClock, Inbox, Cake, Megaphone, Check, X, FileText, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../api/endpoints/dashboard';
import { leaveRequestsApi } from '../api/endpoints/leave';
import { documentsApi, DOCUMENT_TYPE_LABEL } from '../api/endpoints/documents';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const firstName = user?.fullName?.split(' ')[0];

  // A plain EMPLOYEE (seeded with zero permissions - see DataSeeder) lands
  // here right after login with none of EMPLOYEE_VIEW/LEAVE_VIEW/etc. Skip
  // the org-wide queries entirely for that case rather than firing them
  // and showing an error card as someone's first impression after signing
  // in - see the lightweight branch in the return below.
  const canViewOrgSummary = hasPermission('EMPLOYEE_VIEW');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
    enabled: canViewOrgSummary,
  });

  // Approval Queue needs LEAVE_VIEW, which not every role that can see the
  // Dashboard has (Employee, for instance) - skip the request entirely
  // rather than firing it and eating a 403 the person can't act on anyway.
  const canViewApprovals = hasPermission('LEAVE_VIEW') || hasPermission('LEAVE_APPROVE');
  // LEAVE_MANAGE (HR/Admin) sees every pending request org-wide; a Manager
  // has LEAVE_APPROVE without LEAVE_MANAGE and should only see their own
  // direct reports' requests - Phase 1/2 flagged that this wasn't actually
  // scoped yet. /api/dashboard/my-team is the fix for that path.
  const isTeamScoped = hasPermission('LEAVE_APPROVE') && !hasPermission('LEAVE_MANAGE');

  const {
    data: pendingLeave,
    isLoading: pendingLeaveLoading,
    isError: pendingLeaveError,
    refetch: refetchPendingLeave,
  } = useQuery({
    queryKey: ['leave-requests', 'PENDING'],
    queryFn: () => leaveRequestsApi.list('PENDING'),
    enabled: canViewApprovals && !isTeamScoped,
  });

  const {
    data: myTeam,
    isLoading: myTeamLoading,
    isError: myTeamError,
    refetch: refetchMyTeam,
  } = useQuery({
    queryKey: ['dashboard-my-team'],
    queryFn: dashboardApi.myTeam,
    enabled: isTeamScoped,
  });

  const approvalQueue = isTeamScoped ? myTeam?.pendingApprovals : pendingLeave;
  const approvalQueueLoading = isTeamScoped ? myTeamLoading : pendingLeaveLoading;
  const approvalQueueError = isTeamScoped ? myTeamError : pendingLeaveError;
  const refetchApprovalQueue = isTeamScoped ? refetchMyTeam : refetchPendingLeave;

  // /api/documents/expiring-soon requires EMPLOYEE_MANAGE - skip the
  // request entirely for roles that don't have it, same reasoning as the
  // Approval Queue skipping its own query above.
  const canViewExpiringDocs = hasPermission('EMPLOYEE_MANAGE');
  const {
    data: expiringDocs,
    isLoading: expiringDocsLoading,
    isError: expiringDocsError,
    refetch: refetchExpiringDocs,
  } = useQuery({
    queryKey: ['documents-expiring-soon'],
    queryFn: () => documentsApi.expiringSoon(30),
    enabled: canViewExpiringDocs,
  });

  const decideLeave = useMutation({
    mutationFn: ({ id, approve }) => (approve ? leaveRequestsApi.approve(id) : leaveRequestsApi.reject(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-my-team'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const kpis = data
    ? [
        { label: 'Total Employees', value: data.totalEmployees, icon: Users, accent: 'var(--hz-primary-600)' },
        { label: 'Active', value: data.activeEmployees, icon: UserCheck, accent: 'var(--hz-success-500)' },
        { label: 'On Leave', value: data.onLeave, icon: CalendarOff, accent: 'var(--hz-warning-500)' },
        { label: 'Notice Period', value: data.noticePeriod, icon: FileClock, accent: 'var(--hz-danger-500)' },
      ]
    : [];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="hz-greeting">
        <div className="hz-greeting__orb" style={{ width: 220, height: 220, right: -60, top: -90 }} />
        <div className="hz-greeting__orb" style={{ width: 130, height: 130, right: 140, bottom: -60 }} />
        <div className="position-relative">
          <p style={{ fontSize: 'var(--hz-text-sm)', color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginBottom: 6 }}>{today}</p>
          <h1 style={{ fontSize: 'var(--hz-text-3xl)', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Good to see you, {firstName}
          </h1>
          <p style={{ fontSize: 'var(--hz-text-base)', color: 'rgba(255,255,255,0.85)', maxWidth: 480, marginBottom: 0 }}>
            {canViewOrgSummary
              ? "Here's what's happening across your organization today."
              : 'Your profile, leave, and attendance - all in one place.'}
          </p>
        </div>
      </div>

      {!canViewOrgSummary && (
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <Link to={`/employees/${user?.employeeId || ''}`} className="text-decoration-none">
              <Card hoverable className="h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="hz-stat__icon" style={{ background: 'var(--hz-primary-50)', color: 'var(--hz-primary-600)' }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)', marginBottom: 2 }}>
                      My Profile
                    </p>
                    <p className="text-secondary-hz" style={{ fontSize: 12, marginBottom: 0 }}>
                      View your details
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link to={`/employees/${user?.employeeId || ''}?tab=leave`} className="text-decoration-none">
              <Card hoverable className="h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="hz-stat__icon" style={{ background: 'var(--hz-warning-50)', color: 'var(--hz-warning-500)' }}>
                    <CalendarOff size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)', marginBottom: 2 }}>
                      Leave
                    </p>
                    <p className="text-secondary-hz" style={{ fontSize: 12, marginBottom: 0 }}>
                      Check your balance and history
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link to={`/employees/${user?.employeeId || ''}?tab=attendance`} className="text-decoration-none">
              <Card hoverable className="h-100">
                <div className="d-flex align-items-center gap-3">
                  <div className="hz-stat__icon" style={{ background: 'var(--hz-success-50)', color: 'var(--hz-success-500)' }}>
                    <FileClock size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)', marginBottom: 2 }}>
                      Attendance
                    </p>
                    <p className="text-secondary-hz" style={{ fontSize: 12, marginBottom: 0 }}>
                      View your punch history
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {canViewOrgSummary && (
        <>
      {isError && <ErrorState description="Couldn't load dashboard data." onRetry={refetch} />}

      {!isError && (
        <div className="row g-3">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div className="col-12 col-sm-6 col-xl-3" key={i}>
                <SkeletonCard />
              </div>
            ))}
          {!isLoading &&
            kpis.map((kpi) => (
              <div className="col-12 col-sm-6 col-xl-3" key={kpi.label}>
                <Card hoverable className="hz-stat">
                  <div className="d-flex align-items-start justify-content-between">
                    <div>
                      <p className="text-secondary-hz mb-1" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                        {kpi.label}
                      </p>
                      <p className="hz-stat__value" style={{ marginBottom: 0 }}>{kpi.value}</p>
                    </div>
                    <div
                      className="hz-stat__icon"
                      style={{ background: `${kpi.accent}1a`, color: kpi.accent }}
                    >
                      <kpi.icon size={20} />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <Card hoverable title="Headcount by Department" subtitle="Where your people sit today">
            {isLoading && <div className="p-2" />}
            {!isLoading && (!data?.departmentBreakdown || data.departmentBreakdown.length === 0) && (
              <EmptyState
                icon={Users}
                title="No department data yet"
                description="Set up departments and assign employees to them - the breakdown fills in automatically."
              />
            )}
            {!isLoading && data?.departmentBreakdown?.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {data.departmentBreakdown.map((d, i) => {
                  const max = Math.max(...data.departmentBreakdown.map((x) => x.count));
                  const pct = Math.round((d.count / max) * 100);
                  const palette = ['var(--hz-primary-600)', 'var(--hz-accent-500)', 'var(--hz-primary-400)', 'var(--hz-info-500)', 'var(--hz-primary-300)', 'var(--hz-warning-500)'];
                  const color = palette[i % palette.length];
                  return (
                    <div key={d.departmentName}>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{d.departmentName}</span>
                        <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)', fontWeight: 600 }}>{d.count}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'var(--hz-gray-100)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            width: `${pct}%`,
                            background: color,
                            transition: 'width 500ms ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
        <div className="col-12 col-xl-4">
          <Card hoverable title="Approval Queue" subtitle={isTeamScoped ? "Your team's requests" : 'Things waiting on you'}>
            {!canViewApprovals && (
              <EmptyState icon={Inbox} title="Nothing to approve" description="You don't currently hold approval permissions." />
            )}
            {canViewApprovals && approvalQueueError && (
              <ErrorState description="Couldn't load pending requests." onRetry={refetchApprovalQueue} />
            )}
            {canViewApprovals && approvalQueueLoading && <SkeletonText lines={3} />}
            {canViewApprovals && !approvalQueueLoading && !approvalQueueError && (!approvalQueue || approvalQueue.length === 0) && (
              <EmptyState
                icon={Inbox}
                title="Nothing pending"
                description={isTeamScoped ? "None of your direct reports have pending requests." : 'Leave requests, corrections, and approvals will surface here.'}
              />
            )}
            {canViewApprovals && !approvalQueueLoading && !approvalQueueError && approvalQueue?.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {approvalQueue.slice(0, 5).map((req) => (
                  <div key={req.id} className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-start gap-2" style={{ minWidth: 0 }}>
                      <Avatar name={req.employeeName} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                          {req.employeeName}
                        </div>
                        <div className="text-truncate" style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                          {req.leaveTypeName} · {req.days}d · {new Date(req.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => decideLeave.mutate({ id: req.id, approve: true })}
                        disabled={decideLeave.isPending}
                        className="hz-icon-btn d-flex align-items-center justify-content-center border-0"
                        style={{ width: 28, height: 28, color: 'var(--hz-success-600)' }}
                        aria-label={`Approve ${req.employeeName}'s leave request`}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => decideLeave.mutate({ id: req.id, approve: false })}
                        disabled={decideLeave.isPending}
                        className="hz-icon-btn d-flex align-items-center justify-content-center border-0"
                        style={{ width: 28, height: 28, color: 'var(--hz-danger-600)' }}
                        aria-label={`Reject ${req.employeeName}'s leave request`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {approvalQueue.length > 5 && (
                  <Link to="/leave" className="text-decoration-none" style={{ fontSize: 12, fontWeight: 600, color: 'var(--hz-primary-600)' }}>
                    +{approvalQueue.length - 5} more waiting →
                  </Link>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          {isTeamScoped ? (
            <Card hoverable title="My Team" subtitle={myTeam?.teamMembers ? `${myTeam.teamMembers.length} direct reports` : undefined}>
              {myTeamLoading && <SkeletonText lines={3} />}
              {!myTeamLoading && myTeamError && <ErrorState description="Couldn't load your team." onRetry={refetchMyTeam} />}
              {!myTeamLoading && !myTeamError && (!myTeam?.teamMembers || myTeam.teamMembers.length === 0) && (
                <EmptyState icon={Users} title="No direct reports" description="Employees reporting to you will show up here." />
              )}
              {!myTeamLoading && !myTeamError && myTeam?.teamMembers?.length > 0 && (
                <div className="d-flex flex-column gap-3">
                  {myTeam.teamMembers.map((emp) => (
                    <Link key={emp.id} to={`/employees/${emp.id}`} className="hz-joiner-row d-flex align-items-center gap-2 text-decoration-none p-1 rounded-3">
                      <Avatar name={emp.fullName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>{emp.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{emp.designationTitle || '—'}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card hoverable title="Recent Joiners">
              {isLoading && <div className="p-2" />}
              {!isLoading && (!data?.recentJoiners || data.recentJoiners.length === 0) && <EmptyState icon={Users} title="No recent joiners" />}
              {!isLoading && data?.recentJoiners?.length > 0 && (
                <div className="d-flex flex-column gap-3">
                  {data.recentJoiners.map((emp) => (
                    <Link key={emp.id} to={`/employees/${emp.id}`} className="hz-joiner-row d-flex align-items-center gap-2 text-decoration-none p-1 rounded-3">
                      <Avatar name={emp.fullName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>{emp.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                          {emp.designationTitle || '—'} · joined {new Date(emp.dateOfJoining).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
        <div className="col-12 col-xl-4">
          <Card hoverable title="Birthdays" subtitle="Next 7 days">
            {isLoading && <SkeletonText lines={2} />}
            {!isLoading && (!data?.upcomingBirthdays || data.upcomingBirthdays.length === 0) && (
              <EmptyState icon={Cake} title="No birthdays this week" />
            )}
            {!isLoading && data?.upcomingBirthdays?.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {data.upcomingBirthdays.map((emp) => {
                  const dob = new Date(emp.dateOfBirth);
                  const isToday =
                    dob.getMonth() === new Date().getMonth() && dob.getDate() === new Date().getDate();
                  return (
                    <Link
                      key={emp.employeeId}
                      to={`/employees/${emp.employeeId}`}
                      className="hz-joiner-row d-flex align-items-center gap-2 text-decoration-none p-1 rounded-3"
                    >
                      <Avatar name={emp.fullName} size="sm" />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                          {emp.fullName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                          {dob.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      {isToday && (
                        <span style={{ fontSize: 16 }} title="Today!">
                          🎂
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
        <div className="col-12 col-xl-4">
          <Card hoverable title="Announcements">
            <EmptyState
              icon={Megaphone}
              title="Not set up yet"
              description="Org-wide announcements aren't wired to a backend module yet - this card is a placeholder, not an empty inbox."
            />
          </Card>
        </div>
      </div>

      {canViewExpiringDocs && (
        <div className="row g-3">
          <div className="col-12">
            <Card hoverable title="Documents Expiring Soon" subtitle="Next 30 days">
              {expiringDocsLoading && <SkeletonText lines={2} />}
              {expiringDocsError && <ErrorState description="Couldn't load expiring documents." onRetry={refetchExpiringDocs} />}
              {!expiringDocsLoading && !expiringDocsError && (!expiringDocs || expiringDocs.length === 0) && (
                <EmptyState icon={FileText} title="Nothing expiring soon" description="ID proof, visas, certifications, and contracts nearing expiry will show up here." />
              )}
              {!expiringDocsLoading && !expiringDocsError && expiringDocs?.length > 0 && (
                <div className="d-flex flex-column gap-2">
                  {expiringDocs.map((d) => {
                    const days = Math.ceil((new Date(d.expiryDate) - new Date()) / 86400000);
                    return (
                      <Link
                        key={d.id}
                        to={`/employees/${d.employeeId}?tab=documents`}
                        className="d-flex align-items-center justify-content-between text-decoration-none p-2 rounded-3 hz-joiner-row"
                      >
                        <div className="d-flex align-items-center gap-2">
                          <AlertTriangle size={15} color={days < 0 ? 'var(--hz-danger-600)' : 'var(--hz-warning-600)'} />
                          <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600, color: 'var(--hz-text-primary)' }}>{d.employeeName}</span>
                          <span style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{DOCUMENT_TYPE_LABEL[d.documentType] || d.documentType}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: days < 0 ? 'var(--hz-danger-600)' : 'var(--hz-warning-600)' }}>
                          {days < 0 ? 'Expired' : `${days}d left`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
