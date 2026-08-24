import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, FileText, TrendingUp, TrendingDown, Clock3, Trophy, ListFilter, ChevronDown, ChevronRight, LogIn, LogOut, Timer } from 'lucide-react';
import { monitoringReportsApi, formatHoursMinutes } from '../../api/endpoints/monitoring';
import { departmentsApi } from '../../api/endpoints/organization';
import { employeesApi } from '../../api/endpoints/employees';
import { formatDateTimeIST, toISTDateInputValue } from '../../utils/formatDateTime';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

function defaultRange() {
  const end = toISTDateInputValue(new Date());
  const start = toISTDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)); // last 7 days
  return { startDate: start, endDate: end };
}

/**
 * Requirements #3/#4 (Activity Reports + Productivity Summary), #5/#6
 * (Excel/PDF Export), #7 (Report Filters) and #8 (Management View), all in
 * one page - every number comes from MonitoringReportController, which
 * derives everything from real activity_session rows, never mock data.
 */
export default function ProductivityReports() {
  const [filters, setFilters] = useState(() => ({
    ...defaultRange(),
    fromTime: '',
    toTime: '',
    employeeId: '',
    employeeName: '',
    departmentId: '',
    deviceName: '',
  }));
  const [exporting, setExporting] = useState(null);
  const [expandedApplications, setExpandedApplications] = useState(() => new Set());
  const toast = useToast();

  const { data: employees } = useQuery({ queryKey: ['employees-directory'], queryFn: () => employeesApi.list() });
  const { data: departments } = useQuery({ queryKey: ['departments-directory'], queryFn: departmentsApi.list });

  const {
    data: rows,
    isLoading: rowsLoading,
    isError: rowsError,
    refetch: refetchRows,
  } = useQuery({
    queryKey: ['monitoring-productivity', filters],
    queryFn: () => monitoringReportsApi.productivity(filters),
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['monitoring-management', filters],
    queryFn: () => monitoringReportsApi.management(filters),
  });

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }));

  async function handleExport(kind) {
    setExporting(kind);
    try {
      if (kind === 'excel') {
        await monitoringReportsApi.exportExcel(filters);
      } else {
        await monitoringReportsApi.exportPdf(filters);
      }
      toast.success(`${kind === 'excel' ? 'Excel' : 'PDF'} report downloaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not export ${kind.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  }

  const reportSummary = useMemo(() => buildReportSummary(rows || []), [rows]);
  const toggleApplication = (applicationName) => setExpandedApplications((current) => {
    const next = new Set(current);
    if (next.has(applicationName)) next.delete(applicationName);
    else next.add(applicationName);
    return next;
  });

  return (
    <div className="d-flex flex-column gap-4 hz-report-page">
      <div className="hz-report-hero d-flex align-items-start justify-content-between flex-wrap gap-3">
        <div>
          <div className="hz-report-kicker">MONITORING / MANAGER VIEW</div>
          <h1 style={{ fontSize: 'var(--hz-text-3xl)', fontWeight: 700 }}>Productivity Reports</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            A clear view of where time went across the selected period.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="secondary" icon={FileSpreadsheet} loading={exporting === 'excel'} onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
          <Button variant="secondary" icon={FileText} loading={exporting === 'pdf'} onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Requirement #7 - Report Filters */}
      <Card className="hz-report-filters" title="Report scope" subtitle="Adjust the period or focus on one employee" actions={<ListFilter size={16} style={{ color: 'var(--hz-primary-600)' }} />}>
        <div className="row">
          <FormField type="date" col={2} label="Start Date" value={filters.startDate} onChange={set('startDate')} />
          <FormField type="date" col={2} label="End Date" value={filters.endDate} onChange={set('endDate')} />
          <FormField type="time" col={2} label="From Time" value={filters.fromTime} onChange={set('fromTime')} />
          <FormField type="time" col={2} label="To Time" value={filters.toTime} onChange={set('toTime')} />
          <FormField as="select" col={3} label="Employee" value={filters.employeeId} onChange={set('employeeId')}>
            <option value="">All Employees</option>
            {(employees || []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeCode})
              </option>
            ))}
          </FormField>
          <FormField as="select" col={3} label="Department" value={filters.departmentId} onChange={set('departmentId')}>
            <option value="">All Departments</option>
            {(departments || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FormField>
          <FormField col={2} label="Device Name" value={filters.deviceName} onChange={set('deviceName')} placeholder="Search device" />
        </div>
      </Card>

      <div className="row g-3">
        <div className="col-12 col-md-4">
          <MetricCard icon={LogIn} label="Login Time" value={reportSummary.loginTime ? formatDateTimeIST(reportSummary.loginTime) : '—'} accent="teal" />
        </div>
        <div className="col-12 col-md-4">
          <MetricCard icon={LogOut} label="Logout Time" value={reportSummary.logoutTime ? formatDateTimeIST(reportSummary.logoutTime) : '—'} accent="amber" />
        </div>
        <div className="col-12 col-md-4">
          <MetricCard icon={Timer} label="Total Hours" value={formatHoursMinutes(reportSummary.totalSeconds)} accent="indigo" />
        </div>
      </div>

      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-xl-7">
          <Card className="hz-report-panel" title="Application Usage" subtitle="Totals first. Select an application for window-level detail" bodyClassName="p-0">
            <ApplicationUsageList
              applications={reportSummary.applications}
              expandedApplications={expandedApplications}
              onToggle={toggleApplication}
              isLoading={rowsLoading}
              isError={rowsError}
              onRetry={refetchRows}
            />
          </Card>
        </div>
        <div className="col-12 col-xl-5">
          <Card className="hz-report-panel" title="Usage Mix" subtitle="Share of tracked application time">
            <UsagePieChart applications={reportSummary.applications} />
          </Card>
        </div>
      </div>

      {/* Requirement #8 - Management View */}
      <div className="row g-3">
        {insightsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="col-12 col-md-6 col-xl-3" key={i}>
              <SkeletonCard />
            </div>
          ))
        ) : (
          <>
            <div className="col-12 col-xl-6">
              <Card title="Most Active Employees" actions={<TrendingUp size={16} style={{ color: 'var(--hz-success-500)' }} />}>
                <RankingList
                  items={insights?.mostActiveEmployees}
                  unit="h active"
                  emptyText="No activity in this period"
                />
              </Card>
            </div>
            <div className="col-12 col-xl-6">
              <Card title="Highest Idle Employees" actions={<TrendingDown size={16} style={{ color: 'var(--hz-danger-500)' }} />}>
                <RankingList items={insights?.highestIdleEmployees} unit="h idle/break" emptyText="No idle time recorded" />
              </Card>
            </div>
            <div className="col-12 col-xl-6">
              <Card title="Productivity Ranking" actions={<Trophy size={16} style={{ color: 'var(--hz-warning-500)' }} />}>
                <RankingList items={insights?.productivityRanking} unit="% avg" emptyText="No data for ranking" />
              </Card>
            </div>
            <div className="col-12 col-xl-6">
              <Card title="Averages" actions={<Clock3 size={16} style={{ color: 'var(--hz-text-muted)' }} />}>
                <div className="d-flex flex-column gap-3 py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
                      Average Working Hours / Day
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--hz-text-lg)' }}>
                      {(insights?.averageWorkingHours ?? 0).toFixed(1)}h
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
                      Average Productivity
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--hz-text-lg)' }}>
                      {(insights?.averageProductivityPercent ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
                      Employee-Days Analyzed
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--hz-text-lg)' }}>{insights?.employeeDaysAnalyzed ?? 0}</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

function buildReportSummary(rows) {
  const applications = new Map();
  let loginTime = null;
  let logoutTime = null;
  let totalSeconds = 0;
  rows.forEach((row) => {
    if (row.loginTime && (!loginTime || row.loginTime < loginTime)) loginTime = row.loginTime;
    if (row.logoutTime && (!logoutTime || row.logoutTime > logoutTime)) logoutTime = row.logoutTime;
    totalSeconds += Number(row.totalLoggedInSeconds) || 0;
    (row.topApplications || []).forEach((app) => {
      const current = applications.get(app.applicationName) || { applicationName: app.applicationName, seconds: 0, details: new Map() };
      current.seconds += Number(app.seconds) || 0;
      current.details.set(app.windowTitle || '(No window title)', (current.details.get(app.windowTitle || '(No window title)') || 0) + (Number(app.seconds) || 0));
      applications.set(app.applicationName, current);
    });
  });
  return {
    loginTime,
    logoutTime,
    totalSeconds,
    applications: [...applications.values()]
      .map((app) => ({ ...app, details: [...app.details.entries()].sort((a, b) => b[1] - a[1]) }))
      .sort((a, b) => b.seconds - a.seconds),
  };
}

function MetricCard({ icon: Icon, label, value, accent }) {
  return <Card className={`hz-report-metric hz-report-metric--${accent}`}>
    <div className="d-flex align-items-center gap-2"><span className="hz-report-metric__icon"><Icon size={17} /></span><div className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>{label}</div></div>
    <div className="hz-report-metric__value">{value}</div>
  </Card>;
}

function ApplicationUsageList({ applications, expandedApplications, onToggle, isLoading, isError, onRetry }) {
  if (isLoading) return <div className="p-4 text-secondary-hz">Loading application usage...</div>;
  if (isError) return <div className="p-4"><p className="text-secondary-hz">Could not load application usage.</p><Button variant="secondary" onClick={onRetry}>Try again</Button></div>;
  if (!applications.length) return <div className="p-4 text-secondary-hz">No application activity found for this period.</div>;
  const total = applications.reduce((sum, app) => sum + app.seconds, 0);
  return <div>{applications.map((app, index) => {
    const expanded = expandedApplications.has(app.applicationName);
    return <div key={app.applicationName} style={{ borderBottom: index < applications.length - 1 ? '1px solid var(--hz-border-light)' : 'none' }}>
      <button type="button" className="hz-report-app-row w-100 d-flex flex-column gap-2 px-4 py-3 border-0 bg-transparent text-start" onClick={() => onToggle(app.applicationName)}>
        <span className="d-flex align-items-center justify-content-between gap-3"><span className="d-flex align-items-center gap-2"><span className="hz-report-app-row__chevron">{expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</span><strong>{app.applicationName}</strong></span><span style={{ fontWeight: 700 }}>{formatHoursMinutes(app.seconds)}</span></span>
        <span className="hz-report-app-row__track"><span style={{ width: `${total ? (app.seconds / total) * 100 : 0}%` }} /></span>
      </button>
      {expanded && <div className="hz-report-app-details px-5 pb-3">{app.details.map(([title, seconds]) => <div key={title} className="d-flex justify-content-between gap-3 py-1" style={{ fontSize: 'var(--hz-text-sm)' }}><span className="text-secondary-hz text-truncate" title={title}>{title}</span><span className="text-nowrap">{formatHoursMinutes(seconds)}</span></div>)}</div>}
    </div>;
  })}</div>;
}

function UsagePieChart({ applications }) {
  const total = applications.reduce((sum, app) => sum + app.seconds, 0);
  if (!total) return <div className="py-5 text-center text-secondary-hz">No application activity found.</div>;
  let cursor = 0;
  const colors = ['#4f46e5', '#0f766e', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#65a30d', '#db2777'];
  const segments = applications.map((app, index) => {
    const start = cursor;
    cursor += (app.seconds / total) * 360;
    return `${colors[index % colors.length]} ${start}deg ${cursor}deg`;
  });
  return <div className="d-flex align-items-center justify-content-center gap-4 flex-wrap py-2"><div aria-label="Application usage pie chart" role="img" style={{ width: 170, height: 170, borderRadius: '50%', background: `conic-gradient(${segments.join(', ')})` }} /><div className="d-flex flex-column gap-2" style={{ minWidth: 150 }}>{applications.slice(0, 8).map((app, index) => <div key={app.applicationName} className="d-flex align-items-center gap-2" style={{ fontSize: 'var(--hz-text-xs)' }}><span style={{ width: 9, height: 9, background: colors[index % colors.length], display: 'inline-block', borderRadius: 2 }} /><span className="text-truncate">{app.applicationName}</span><strong className="ms-auto">{Math.round((app.seconds / total) * 100)}%</strong></div>)}</div></div>;
}

function RankingList({ items, unit, emptyText }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-secondary-hz py-3 mb-0" style={{ fontSize: 'var(--hz-text-sm)' }}>
        {emptyText}
      </p>
    );
  }
  return (
    <div className="d-flex flex-column">
      {items.map((item, i) => (
        <div
          key={item.employeeId}
          className="d-flex align-items-center justify-content-between py-2"
          style={{ borderBottom: i < items.length - 1 ? '1px solid var(--hz-border-light)' : 'none' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className="d-flex align-items-center justify-content-center"
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--hz-neutral-100)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--hz-text-secondary)',
              }}
            >
              {i + 1}
            </span>
            <div>
              <div style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{item.employeeName}</div>
              <div style={{ fontSize: 11, color: 'var(--hz-text-muted)' }}>{item.departmentName || '—'}</div>
            </div>
          </div>
          <span style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)' }}>
            {item.value} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}
