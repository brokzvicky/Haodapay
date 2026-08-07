import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Users, Clock, CalendarDays, Briefcase } from 'lucide-react';
import { reportsApi } from '../../api/endpoints/reports';
import { exportToCsv } from '../../utils/exportToCsv';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonCard } from '../../components/ui/Skeleton';

const TABS = [
  { key: 'employees', label: 'Employee', icon: Users },
  { key: 'attendance', label: 'Attendance', icon: Clock },
  { key: 'leave', label: 'Leave', icon: CalendarDays },
  { key: 'recruitment', label: 'Recruitment', icon: Briefcase },
];

function Bar({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{value}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--hz-gray-100)' }}>
        <div style={{ height: 8, borderRadius: 999, width: `${pct}%`, background: 'var(--hz-primary-500)' }} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card>
      <p className="text-secondary-hz mb-1" style={{ fontSize: 'var(--hz-text-sm)' }}>
        {label}
      </p>
      <p style={{ fontSize: 'var(--hz-text-3xl)', fontWeight: 700, marginBottom: 0 }}>{value}</p>
    </Card>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('employees');

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Reports & Analytics</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Live numbers pulled straight from the same data every other module writes to
        </p>
      </div>

      <div className="d-flex gap-2" style={{ borderBottom: '1px solid var(--hz-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn border-0 rounded-0 px-3 py-2 d-flex align-items-center gap-2"
            style={{
              fontSize: 'var(--hz-text-sm)',
              fontWeight: 600,
              color: tab === t.key ? 'var(--hz-primary-700)' : 'var(--hz-text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--hz-primary-600)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'employees' && <EmployeeReportPanel />}
      {tab === 'attendance' && <AttendanceReportPanel />}
      {tab === 'leave' && <LeaveReportPanel />}
      {tab === 'recruitment' && <RecruitmentReportPanel />}
    </div>
  );
}

function EmployeeReportPanel() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['report-employees'], queryFn: reportsApi.employees });

  if (isLoading) return <SkeletonGrid />;
  if (isError) return <ErrorState description="Couldn't load the employee report." onRetry={refetch} />;

  const maxDept = Math.max(1, ...data.byDepartment.map((d) => d.count));

  return (
    <div className="d-flex flex-column gap-3">
      <div className="row g-3">
        <div className="col-6 col-xl-3"><Stat label="Total Employees" value={data.totalEmployees} /></div>
        <div className="col-6 col-xl-3"><Stat label="Joined Last 30 Days" value={data.newJoinersLast30Days} /></div>
        <div className="col-6 col-xl-3"><Stat label="Joined Last 90 Days" value={data.newJoinersLast90Days} /></div>
        <div className="col-6 col-xl-3"><Stat label="Separations (90d)" value={data.separationsLast90Days} /></div>
      </div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <Card
            title="Headcount by Status"
            actions={
              <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('employee-status-report', Object.entries(data.byStatus).map(([status, count]) => ({ status, count })))}>
                Export CSV
              </Button>
            }
          >
            {Object.entries(data.byStatus).map(([status, count]) => (
              <Bar key={status} label={status.replace('_', ' ')} value={count} max={data.totalEmployees} />
            ))}
          </Card>
        </div>
        <div className="col-12 col-lg-6">
          <Card
            title="Headcount by Department"
            actions={
              <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('employee-department-report', data.byDepartment.map((d) => ({ department: d.departmentName, count: d.count })))}>
                Export CSV
              </Button>
            }
          >
            {data.byDepartment.length === 0 && <p style={{ fontSize: 13, color: 'var(--hz-text-muted)' }}>No department assignments yet.</p>}
            {data.byDepartment.map((d) => (
              <Bar key={d.departmentName} label={d.departmentName} value={d.count} max={maxDept} />
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function AttendanceReportPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['report-attendance', startDate, endDate],
    queryFn: () => reportsApi.attendance(startDate, endDate),
  });

  return (
    <div className="d-flex flex-column gap-3">
      <Card>
        <div className="d-flex align-items-end gap-3 flex-wrap">
          <div>
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>From</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>To</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {isLoading && <SkeletonGrid />}
      {isError && <ErrorState description="Couldn't load the attendance report." onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          <div className="row g-3">
            <div className="col-6 col-xl-4"><Stat label="Total Punches" value={data.totalPunches} /></div>
            <div className="col-6 col-xl-4"><Stat label="Unique Employees Punched" value={data.uniqueEmployeesPunched} /></div>
            <div className="col-6 col-xl-4"><Stat label="Active Employees" value={data.totalActiveEmployees} /></div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <Card
                title="Daily Distinct Employees Punched"
                actions={
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('attendance-daily-report', data.dailyDistinctEmployees.map((d) => ({ date: d.date, employeesPunched: d.count })))}>
                    Export CSV
                  </Button>
                }
              >
                {data.dailyDistinctEmployees.map((d) => (
                  <Bar key={d.date} label={new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} value={d.count} max={Math.max(1, data.totalActiveEmployees)} />
                ))}
              </Card>
            </div>
            <div className="col-12 col-lg-5">
              <Card
                title="Punches by Department"
                actions={
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('attendance-department-report', data.byDepartment.map((d) => ({ department: d.departmentName, punches: d.punchCount })))}>
                    Export CSV
                  </Button>
                }
              >
                {data.byDepartment.length === 0 && <p style={{ fontSize: 13, color: 'var(--hz-text-muted)' }}>No punches mapped to a department in this range.</p>}
                {data.byDepartment.map((d) => (
                  <Bar key={d.departmentName} label={d.departmentName} value={d.punchCount} max={Math.max(1, ...data.byDepartment.map((x) => x.punchCount))} />
                ))}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LeaveReportPanel() {
  const [year, setYear] = useState(new Date().getFullYear());
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['report-leave', year], queryFn: () => reportsApi.leave(year) });

  return (
    <div className="d-flex flex-column gap-3">
      <Card>
        <div style={{ maxWidth: 160 }}>
          <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Year</label>
          <input type="number" className="form-control" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </Card>

      {isLoading && <SkeletonGrid />}
      {isError && <ErrorState description="Couldn't load the leave report." onRetry={refetch} />}

      {!isLoading && !isError && (
        <>
          <div className="row g-3">
            <div className="col-6 col-xl-3"><Stat label="Total Requests" value={data.totalRequests} /></div>
            <div className="col-6 col-xl-3"><Stat label="Approved" value={data.approved} /></div>
            <div className="col-6 col-xl-3"><Stat label="Rejected" value={data.rejected} /></div>
            <div className="col-6 col-xl-3"><Stat label="Approval Rate" value={`${data.approvalRatePercent}%`} /></div>
          </div>
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <Card
                title="Approved Days by Leave Type"
                actions={
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('leave-type-report', data.byLeaveType.map((l) => ({ leaveType: l.leaveTypeName, approvedDays: l.approvedDays })))}>
                    Export CSV
                  </Button>
                }
              >
                {data.byLeaveType.length === 0 && <p style={{ fontSize: 13, color: 'var(--hz-text-muted)' }}>No approved leave in {year} yet.</p>}
                {data.byLeaveType.map((l) => (
                  <Bar key={l.leaveTypeName} label={l.leaveTypeName} value={l.approvedDays} max={Math.max(1, ...data.byLeaveType.map((x) => x.approvedDays))} />
                ))}
              </Card>
            </div>
            <div className="col-12 col-lg-6">
              <Card
                title="Approved Days by Department"
                actions={
                  <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('leave-department-report', data.byDepartment.map((d) => ({ department: d.departmentName, approvedDays: d.approvedDays })))}>
                    Export CSV
                  </Button>
                }
              >
                {data.byDepartment.length === 0 && <p style={{ fontSize: 13, color: 'var(--hz-text-muted)' }}>No approved leave in {year} yet.</p>}
                {data.byDepartment.map((d) => (
                  <Bar key={d.departmentName} label={d.departmentName} value={d.approvedDays} max={Math.max(1, ...data.byDepartment.map((x) => x.approvedDays))} />
                ))}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RecruitmentReportPanel() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['report-recruitment'], queryFn: reportsApi.recruitment });

  if (isLoading) return <SkeletonGrid />;
  if (isError) return <ErrorState description="Couldn't load the recruitment report." onRetry={refetch} />;

  const maxStage = Math.max(1, ...Object.values(data.byStage));

  return (
    <div className="d-flex flex-column gap-3">
      <div className="row g-3">
        <div className="col-6 col-xl-3"><Stat label="Open Requisitions" value={data.openRequisitions} /></div>
        <div className="col-6 col-xl-3"><Stat label="Total Candidates" value={data.totalCandidates} /></div>
        <div className="col-6 col-xl-3"><Stat label="Hired This Year" value={data.hiredThisYear} /></div>
        <div className="col-6 col-xl-3"><Stat label="Avg. Days to Hire" value={data.averageDaysToHire ?? '—'} /></div>
      </div>
      <Card
        title="Pipeline Funnel"
        actions={
          <Button size="sm" variant="secondary" icon={Download} onClick={() => exportToCsv('recruitment-pipeline-report', Object.entries(data.byStage).map(([stage, count]) => ({ stage, count })))}>
            Export CSV
          </Button>
        }
      >
        {Object.entries(data.byStage).map(([stage, count]) => (
          <Bar key={stage} label={stage} value={count} max={maxStage} />
        ))}
      </Card>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="row g-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="col-6 col-xl-3" key={i}>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
