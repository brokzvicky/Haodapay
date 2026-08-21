import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Monitor, Wifi, WifiOff, Activity, AppWindow, Clock } from 'lucide-react';
import {
  monitoringApi,
  isDeviceOnline,
  getSessionId,
  getSessionEmployeeName,
  getSessionApp,
  getSessionDeviceName,
  getSessionStart,
  getSessionDurationSeconds,
  aggregateSessionsByApp,
} from '../../api/endpoints/monitoring';
import { todayRangeIST, timeAgoIST, formatDurationShort } from '../../utils/formatDateTime';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonCard, SkeletonText } from '../../components/ui/Skeleton';

export default function MonitoringDashboard() {
  const { from, to } = useMemo(() => todayRangeIST(), []);

  const {
    data: devices,
    isLoading: devicesLoading,
    isError: devicesError,
    refetch: refetchDevices,
  } = useQuery({ queryKey: ['monitoring-devices'], queryFn: monitoringApi.devices, refetchInterval: 30_000 });

  const {
    data: todaySessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useQuery({ queryKey: ['monitoring-sessions-today', from, to], queryFn: () => monitoringApi.sessions(from, to) });

  const totalDevices = devices?.length ?? 0;
  const onlineDevices = useMemo(() => (devices || []).filter(isDeviceOnline).length, [devices]);
  const offlineDevices = totalDevices - onlineDevices;

  const totalTrackedSeconds = useMemo(
    () => (todaySessions || []).reduce((sum, s) => sum + getSessionDurationSeconds(s), 0),
    [todaySessions]
  );
  const activeEmployeesToday = useMemo(() => {
    const names = new Set((todaySessions || []).map((s) => getSessionEmployeeName(s)));
    return names.size;
  }, [todaySessions]);

  const topApps = useMemo(() => aggregateSessionsByApp(todaySessions, 5), [todaySessions]);
  const maxAppSeconds = topApps[0]?.seconds || 1;

  const recentActivity = useMemo(
    () =>
      [...(todaySessions || [])]
        .sort((a, b) => new Date(getSessionStart(b)) - new Date(getSessionStart(a)))
        .slice(0, 8),
    [todaySessions]
  );

  const kpis = [
    { label: 'Total Devices', value: totalDevices, icon: Monitor, accent: 'var(--hz-primary-600)' },
    { label: 'Online Devices', value: onlineDevices, icon: Wifi, accent: 'var(--hz-success-500)' },
    { label: 'Offline Devices', value: offlineDevices, icon: WifiOff, accent: 'var(--hz-gray-500)' },
    { label: "Today's Sessions", value: todaySessions?.length ?? 0, icon: Activity, accent: 'var(--hz-warning-500)' },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Employee Monitoring</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Device and activity overview, updated in real time from the monitoring agents
        </p>
      </div>

      {devicesError && <ErrorState description="Couldn't load monitoring devices." onRetry={refetchDevices} />}

      {!devicesError && (
        <div className="row g-3">
          {devicesLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div className="col-12 col-sm-6 col-xl-3" key={i}>
                <SkeletonCard />
              </div>
            ))}
          {!devicesLoading &&
            kpis.map((kpi) => (
              <div className="col-12 col-sm-6 col-xl-3" key={kpi.label}>
                <Card hoverable className="hz-stat">
                  <div className="d-flex align-items-start justify-content-between">
                    <div>
                      <p className="text-secondary-hz mb-1" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                        {kpi.label}
                      </p>
                      <p className="hz-stat__value" style={{ marginBottom: 0 }}>
                        {kpi.value}
                      </p>
                    </div>
                    <div className="hz-stat__icon" style={{ background: `${kpi.accent}1a`, color: kpi.accent }}>
                      <kpi.icon size={20} />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-xl-4">
          <Card hoverable title="Today's Activity Summary" subtitle="Asia/Kolkata">
            {sessionsLoading && <SkeletonText lines={3} />}
            {sessionsError && <ErrorState description="Couldn't load today's activity." onRetry={refetchSessions} />}
            {!sessionsLoading && !sessionsError && (
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="hz-stat__icon" style={{ background: 'var(--hz-primary-50)', color: 'var(--hz-primary-600)' }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 'var(--hz-text-lg)', marginBottom: 0 }}>
                      {formatDurationShort(totalTrackedSeconds)}
                    </p>
                    <p className="text-secondary-hz" style={{ fontSize: 12, marginBottom: 0 }}>
                      Total tracked time today
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="hz-stat__icon" style={{ background: 'var(--hz-success-50)', color: 'var(--hz-success-500)' }}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 'var(--hz-text-lg)', marginBottom: 0 }}>{activeEmployeesToday}</p>
                    <p className="text-secondary-hz" style={{ fontSize: 12, marginBottom: 0 }}>
                      Active employees today
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="col-12 col-xl-8">
          <Card hoverable title="Top Applications by Duration" subtitle="Today, all employees">
            {sessionsLoading && <SkeletonText lines={4} />}
            {sessionsError && <ErrorState description="Couldn't load application usage." onRetry={refetchSessions} />}
            {!sessionsLoading && !sessionsError && topApps.length === 0 && (
              <EmptyState icon={AppWindow} title="No application activity yet today" />
            )}
            {!sessionsLoading && !sessionsError && topApps.length > 0 && (
              <div className="d-flex flex-column gap-3">
                {topApps.map((app) => {
                  const pct = Math.round((app.seconds / maxAppSeconds) * 100);
                  return (
                    <div key={app.applicationName}>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{app.applicationName}</span>
                        <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)', fontWeight: 600 }}>
                          {formatDurationShort(app.seconds)}
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 999, background: 'var(--hz-gray-100)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            width: `${pct}%`,
                            background: 'var(--hz-primary-500)',
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
      </div>

      <Card
        hoverable
        title="Recent Activity"
        subtitle="Latest sessions reported by agents"
        actions={
          <Link to="/monitoring/activity" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600, color: 'var(--hz-primary-600)' }}>
            View all →
          </Link>
        }
      >
        {sessionsLoading && <SkeletonText lines={4} />}
        {sessionsError && <ErrorState description="Couldn't load recent activity." onRetry={refetchSessions} />}
        {!sessionsLoading && !sessionsError && recentActivity.length === 0 && (
          <EmptyState icon={Activity} title="No activity yet today" description="Sessions reported by the Windows Agent will show up here." />
        )}
        {!sessionsLoading && !sessionsError && recentActivity.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {recentActivity.map((s) => (
              <div key={getSessionId(s)} className="d-flex align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                  <Avatar name={getSessionEmployeeName(s)} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                      {getSessionEmployeeName(s)}
                    </div>
                    <div className="text-truncate" style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                      {getSessionApp(s)} · {getSessionDeviceName(s)}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--hz-text-muted)', flexShrink: 0 }}>{timeAgoIST(getSessionStart(s))}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="d-flex justify-content-end">
        <Link to="/monitoring/devices" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600, color: 'var(--hz-primary-600)' }}>
          Manage devices →
        </Link>
      </div>
    </div>
  );
}
