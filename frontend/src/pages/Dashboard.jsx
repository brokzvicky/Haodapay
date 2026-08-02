import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CalendarOff, FileClock, Inbox, Cake, Megaphone } from 'lucide-react';
import { dashboardApi } from '../api/endpoints/dashboard';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonCard } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
  });

  const kpis = data
    ? [
        { label: 'Total Employees', value: data.totalEmployees, icon: Users, accent: 'var(--hz-primary-600)' },
        { label: 'Active', value: data.activeEmployees, icon: UserCheck, accent: 'var(--hz-success-500)' },
        { label: 'On Leave', value: data.onLeave, icon: CalendarOff, accent: 'var(--hz-warning-500)' },
        { label: 'Notice Period', value: data.noticePeriod, icon: FileClock, accent: 'var(--hz-danger-500)' },
      ]
    : [];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Good to see you, {firstName}</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Here's what's happening across your organization
        </p>
      </div>

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
                <Card>
                  <div className="d-flex align-items-start justify-content-between">
                    <div>
                      <p className="text-secondary-hz mb-1" style={{ fontSize: 'var(--hz-text-sm)' }}>
                        {kpi.label}
                      </p>
                      <p style={{ fontSize: 'var(--hz-text-3xl)', fontWeight: 700, marginBottom: 0 }}>{kpi.value}</p>
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.accent}1a`, color: kpi.accent }}
                    >
                      <kpi.icon size={19} />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <Card title="Headcount by Department" subtitle="Where your people sit today">
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
                {data.departmentBreakdown.map((d) => {
                  const max = Math.max(...data.departmentBreakdown.map((x) => x.count));
                  const pct = Math.round((d.count / max) * 100);
                  return (
                    <div key={d.departmentName}>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{d.departmentName}</span>
                        <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{d.count}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'var(--hz-gray-100)' }}>
                        <div style={{ height: 8, borderRadius: 999, width: `${pct}%`, background: 'var(--hz-primary-500)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
        <div className="col-12 col-xl-4">
          <Card title="Approval Queue" subtitle="Things waiting on you">
            <EmptyState icon={Inbox} title="Nothing pending" description="Leave requests, corrections, and approvals will surface here." />
          </Card>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <Card title="Recent Joiners">
            {isLoading && <div className="p-2" />}
            {!isLoading && (!data?.recentJoiners || data.recentJoiners.length === 0) && <EmptyState icon={Users} title="No recent joiners" />}
            {!isLoading && data?.recentJoiners?.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {data.recentJoiners.map((emp) => (
                  <Link key={emp.id} to={`/employees/${emp.id}`} className="d-flex align-items-center gap-2 text-decoration-none">
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
        </div>
        <div className="col-12 col-xl-4">
          <Card title="Birthdays" subtitle="This week">
            <EmptyState icon={Cake} title="No birthdays this week" />
          </Card>
        </div>
        <div className="col-12 col-xl-4">
          <Card title="Announcements">
            <EmptyState icon={Megaphone} title="No announcements" description="Org-wide announcements will post here." />
          </Card>
        </div>
      </div>
    </div>
  );
}
