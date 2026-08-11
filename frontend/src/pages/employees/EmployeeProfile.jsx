import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Users, ChevronDown, Fingerprint, Pencil, Check, X, CalendarDays, Clock } from 'lucide-react';
import { employeesApi } from '../../api/endpoints/employees';
import { leaveRequestsApi } from '../../api/endpoints/leave';
import { attendanceApi } from '../../api/endpoints/attendance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonText } from '../../components/ui/Skeleton';
import { statusMeta, STATUS_META, SELECTABLE_STATUSES, EMPLOYMENT_TYPE_LABEL } from './statusMeta';
import { leaveStatusMeta } from '../leave/leaveStatusMeta';
import { useBreadcrumbLabel } from '../../components/layout/BreadcrumbContext';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'hierarchy', label: 'Reporting Hierarchy' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'leave', label: 'Leave' },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const validTabKeys = TABS.map((t) => t.key);
  const initialTab = validTabKeys.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const [tab, setTab] = useState(initialTab);
  const queryClient = useQueryClient();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  function changeTab(key) {
    setTab(key);
    setSearchParams(key === 'overview' ? {} : { tab: key }, { replace: true });
  }

  const { data: employee, isLoading, isError, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.getById(id),
  });

  useBreadcrumbLabel(employee?.fullName);

  const changeStatus = useMutation({
    mutationFn: (status) => employeesApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setStatusMenuOpen(false);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <SkeletonText lines={8} />
      </Card>
    );
  }

  if (isError || !employee) {
    return <ErrorState description="Couldn't load this employee." onRetry={refetch} />;
  }

  const meta = statusMeta(employee.status);

  return (
    <div className="d-flex flex-column gap-4">
      <Link to="/employees" className="d-inline-flex align-items-center gap-1 text-decoration-none" style={{ color: 'var(--hz-text-secondary)', fontSize: 'var(--hz-text-sm)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to Employees
      </Link>

      <Card>
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <Avatar name={employee.fullName} size="xl" />
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 style={{ fontSize: 'var(--hz-text-xl)', fontWeight: 700, margin: 0 }}>{employee.fullName}</h1>
                <Badge variant={meta.variant} dot>
                  {meta.label}
                </Badge>
              </div>
              <p className="text-secondary-hz mb-1" style={{ fontSize: 'var(--hz-text-sm)' }}>
                {employee.designationTitle || 'No designation set'} {employee.departmentName ? `· ${employee.departmentName}` : ''}
              </p>
              <p className="text-muted-hz mb-0" style={{ fontSize: 12 }}>
                {employee.employeeCode} · {EMPLOYMENT_TYPE_LABEL[employee.employmentType] || employee.employmentType}
              </p>
            </div>
          </div>

          <div className="position-relative">
            <Button variant="secondary" size="sm" onClick={() => setStatusMenuOpen((o) => !o)}>
              Change Status <ChevronDown size={14} />
            </Button>
            {statusMenuOpen && (
              <>
                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 15 }} onClick={() => setStatusMenuOpen(false)} />
                <div className="position-absolute end-0 mt-2 hz-surface" style={{ width: 200, zIndex: 20, padding: 6 }}>
                  {SELECTABLE_STATUSES.map((key) => {
                    const val = STATUS_META[key];
                    return (
                    <button
                      key={key}
                      disabled={key === employee.status || changeStatus.isPending}
                      onClick={() => changeStatus.mutate(key)}
                      className="btn btn-light border-0 w-100 text-start px-2 py-2 d-flex align-items-center gap-2"
                      style={{ opacity: key === employee.status ? 0.5 : 1 }}
                    >
                      <Badge variant={val.variant} dot>
                        {val.label}
                      </Badge>
                    </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="d-flex gap-2" style={{ borderBottom: '1px solid var(--hz-border)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
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

      {tab === 'overview' && <OverviewTab employee={employee} />}
      {tab === 'hierarchy' && <HierarchyTab employee={employee} />}
      {tab === 'attendance' && <AttendanceTab employee={employee} />}
      {tab === 'leave' && <LeaveTab employee={employee} />}
    </div>
  );
}

function OverviewTab({ employee }) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [editingBiometric, setEditingBiometric] = useState(false);
  const [pinValue, setPinValue] = useState(employee.biometricDeviceUserId || '');

  const saveBiometric = useMutation({
    mutationFn: () => employeesApi.setBiometricMapping(employee.id, pinValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      setEditingBiometric(false);
    },
  });

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-6">
        <Card title="Contact">
          <InfoRow icon={Mail} label="Email" value={employee.email} />
          <InfoRow icon={Phone} label="Phone" value={employee.phone} />
          <InfoRow icon={MapPin} label="Address" value={employee.address} />
        </Card>
      </div>
      <div className="col-12 col-lg-6">
        <Card title="Employment">
          <InfoRow icon={Calendar} label="Date of Joining" value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : null} />
          <InfoRow icon={Briefcase} label="Employment Type" value={EMPLOYMENT_TYPE_LABEL[employee.employmentType] || employee.employmentType} />
          <InfoRow icon={Users} label="Team" value={employee.teamName} />
        </Card>
      </div>
      <div className="col-12 col-lg-6">
        <Card title="Personal">
          <InfoRow icon={Calendar} label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : null} />
          <InfoRow label="Gender" value={employee.gender} />
        </Card>
      </div>
      <div className="col-12 col-lg-6">
        <Card title="Emergency Contact">
          <InfoRow label="Name" value={employee.emergencyContactName} />
          <InfoRow icon={Phone} label="Phone" value={employee.emergencyContactPhone} />
        </Card>
      </div>
      <div className="col-12 col-lg-6">
        <Card title="Biometric Enrollment" subtitle="The PIN this employee is enrolled under on the fingerprint device">
          <div className="d-flex align-items-center gap-2 py-2">
            <Fingerprint size={15} style={{ color: 'var(--hz-text-muted)', flexShrink: 0 }} />
            {editingBiometric ? (
              <>
                <input
                  className="form-control form-control-sm"
                  style={{ width: 140 }}
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value)}
                  placeholder="Device PIN"
                  autoFocus
                />
                <button className="btn btn-sm btn-light border-0" onClick={() => saveBiometric.mutate()} aria-label="Save biometric mapping">
                  <Check size={14} />
                </button>
                <button className="btn btn-sm btn-light border-0" onClick={() => setEditingBiometric(false)} aria-label="Cancel editing biometric mapping">
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                  {employee.biometricDeviceUserId || 'Not mapped'}
                </span>
                <button className="btn btn-sm btn-light border-0 p-1" onClick={() => setEditingBiometric(true)} aria-label="Edit biometric mapping">
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function HierarchyTab({ employee }) {
  return (
    <div className="row g-3">
      <div className="col-12 col-lg-6">
        <Card title="Reports To">
          {employee.reportingManagerId ? (
            <Link to={`/employees/${employee.reportingManagerId}`} className="d-flex align-items-center gap-2 text-decoration-none">
              <Avatar name={employee.reportingManagerName} size="md" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                  {employee.reportingManagerName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{employee.reportingManagerDesignation}</div>
              </div>
            </Link>
          ) : (
            <EmptyState icon={Users} title="No manager set" description="This employee doesn't have a reporting manager assigned." />
          )}
        </Card>
      </div>
      <div className="col-12 col-lg-6">
        <Card title="Direct Reports" subtitle={`${employee.directReports?.length || 0} people`}>
          {employee.directReports?.length ? (
            <div className="d-flex flex-column gap-3">
              {employee.directReports.map((report) => (
                <Link key={report.id} to={`/employees/${report.id}`} className="d-flex align-items-center gap-2 text-decoration-none">
                  <Avatar name={report.fullName} size="sm" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>{report.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{report.designationTitle || '—'}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No direct reports" />
          )}
        </Card>
      </div>
    </div>
  );
}

function AttendanceTab({ employee }) {
  const { data: records, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance-employee', String(employee.id)],
    queryFn: () => attendanceApi.byEmployee(employee.id),
  });

  return (
    <Card title="Punch History" bodyClassName="p-0">
      {isLoading && (
        <div className="p-4">
          <SkeletonText lines={5} />
        </div>
      )}
      {isError && <ErrorState description="Couldn't load attendance records." onRetry={refetch} />}
      {!isLoading && !isError && records?.length === 0 && (
        <EmptyState icon={Clock} title="No punches recorded" description="Attendance records from biometric devices will show up here." />
      )}
      {!isLoading && !isError && records?.length > 0 && (
        <table className="table mb-0 align-middle">
          <thead>
            <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
              <th className="ps-4">Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Verify Mode</th>
              <th className="pe-4">Device</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="ps-4" style={{ fontSize: 'var(--hz-text-sm)' }}>{new Date(r.punchTime).toLocaleDateString()}</td>
                <td style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{new Date(r.punchTime).toLocaleTimeString()}</td>
                <td>
                  <Badge variant={r.punchType === 'IN' ? 'success' : r.punchType === 'OUT' ? 'danger' : 'neutral'}>{r.punchType}</Badge>
                </td>
                <td style={{ fontSize: 'var(--hz-text-sm)' }}>{r.verifyMode || '—'}</td>
                <td className="pe-4" style={{ fontSize: 'var(--hz-text-sm)' }}>{r.deviceName || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function LeaveTab({ employee }) {
  const year = new Date().getFullYear();
  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balance', String(employee.id), year],
    queryFn: () => leaveRequestsApi.balance(employee.id, year),
  });
  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave-requests-employee', String(employee.id)],
    queryFn: () => leaveRequestsApi.byEmployee(employee.id),
  });

  return (
    <div className="row g-3">
      <div className="col-12 col-lg-5">
        <Card title="Leave Balance" subtitle={`${year}`}>
          {balancesLoading && <SkeletonText lines={3} />}
          {!balancesLoading && balances?.length === 0 && <EmptyState title="No leave types configured" />}
          {!balancesLoading &&
            balances?.map((b) => (
              <div key={b.leaveTypeId} className="py-2" style={{ borderBottom: '1px solid var(--hz-border)' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{b.leaveTypeName}</span>
                  <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                    {b.remainingDays} / {b.allocatedDays + b.carriedForwardDays}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--hz-gray-100)' }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 999,
                      width: `${Math.min(100, Math.round((b.usedDays / (b.allocatedDays + b.carriedForwardDays || 1)) * 100))}%`,
                      background: 'var(--hz-primary-500)',
                    }}
                  />
                </div>
              </div>
            ))}
        </Card>
      </div>
      <div className="col-12 col-lg-7">
        <Card title="Request History">
          {requestsLoading && <SkeletonText lines={4} />}
          {!requestsLoading && requests?.length === 0 && (
            <EmptyState icon={CalendarDays} title="No leave requests yet" />
          )}
          {!requestsLoading && requests?.length > 0 && (
            <div className="d-flex flex-column gap-3">
              {requests.map((r) => {
                const meta = leaveStatusMeta(r.status);
                return (
                  <div key={r.id} className="d-flex align-items-center justify-content-between">
                    <div>
                      <div style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600 }}>{r.leaveTypeName}</div>
                      <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                        {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()} · {r.days} day(s)
                      </div>
                    </div>
                    <Badge variant={meta.variant} dot>
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="d-flex align-items-center gap-2 py-2" style={{ borderBottom: '1px solid var(--hz-border)' }}>
      {Icon && <Icon size={15} style={{ color: 'var(--hz-text-muted)', flexShrink: 0 }} />}
      <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)', minWidth: 110 }}>{label}</span>
      <span style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}
