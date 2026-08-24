import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, Activity as ActivityIcon } from 'lucide-react';
import {
  monitoringApi,
  getSessionId,
  getSessionEmployeeName,
  getSessionDeviceName,
  getSessionApp,
  getSessionWindowTitle,
  getSessionStart,
  getSessionEnd,
  getSessionDurationSeconds,
} from '../../api/endpoints/monitoring';
import { employeesApi } from '../../api/endpoints/employees';
import { formatDateTimeIST, formatDurationShort, toISTDateInputValue, istDateInputToUtcRange } from '../../utils/formatDateTime';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';

const PAGE_SIZE = 25;

/**
 * Fix for "No activity in this range": this page used to fetch only the
 * 50 most-recent sessions for a selected employee (unfiltered by date)
 * and apply the date range as a client-side filter on that truncated
 * batch - any date range outside those 50 rows silently showed zero
 * results even when matching data existed. It now calls
 * monitoringApi.sessionsSearch(), which combines date range + employee +
 * device server-side (GET /api/monitoring/sessions/search) with real
 * pagination, so filters are always applied against the full table.
 */
export default function Activity() {
  const today = toISTDateInputValue();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [employeeId, setEmployeeId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });
  const { data: devices } = useQuery({ queryKey: ['monitoring-devices'], queryFn: monitoringApi.devices });

  const { from } = istDateInputToUtcRange(dateFrom);
  const { to } = istDateInputToUtcRange(dateTo);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['monitoring-sessions-search', from, to, employeeId, deviceId, page],
    queryFn: () =>
      monitoringApi.sessionsSearch({
        from,
        to,
        employeeId: employeeId || undefined,
        deviceId: deviceId || undefined,
        page,
        size: PAGE_SIZE,
      }),
  });

  const rows = data?.rows || [];
  const totalElements = data?.totalElements ?? 0;
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  // Text search only narrows what's already on the current page - a full
  // cross-page text search would need its own backend query param, which
  // isn't part of this fix's scope.
  const q = search.trim().toLowerCase();
  const pageRows = q
    ? rows.filter((s) =>
        [getSessionEmployeeName(s), getSessionDeviceName(s), getSessionApp(s), getSessionWindowTitle(s)]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : rows;

  function updateFilter(setter) {
    return (value) => {
      setter(value);
      setPage(0);
    };
  }

  const columns = [
    { key: 'employee', label: 'Employee', headerClassName: 'ps-4', className: 'ps-4', render: (s) => getSessionEmployeeName(s), style: { fontWeight: 600 } },
    { key: 'device', label: 'Device', render: (s) => getSessionDeviceName(s) },
    { key: 'application', label: 'Application', render: (s) => getSessionApp(s) },
    { key: 'windowTitle', label: 'Window Title', render: (s) => getSessionWindowTitle(s) },
    { key: 'start', label: 'Start Time', render: (s) => formatDateTimeIST(getSessionStart(s)) },
    { key: 'end', label: 'End Time', render: (s) => formatDateTimeIST(getSessionEnd(s)) },
    {
      key: 'duration',
      label: 'Duration',
      headerClassName: 'pe-4',
      className: 'pe-4',
      render: (s) => formatDurationShort(getSessionDurationSeconds(s)),
    },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Activity</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Application and window activity sessions reported by the monitoring agents
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap">
        <div className="position-relative" style={{ maxWidth: 320, width: '100%' }}>
          <Search size={16} className="position-absolute" style={{ left: 12, top: 10, color: 'var(--hz-text-muted)' }} />
          <input
            type="search"
            placeholder="Search employee, app, window, device… (current page)"
            className="form-control ps-5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ maxWidth: 220 }} value={employeeId} onChange={(e) => updateFilter(setEmployeeId)(e.target.value)}>
          <option value="">All Employees</option>
          {(employees || []).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName}
            </option>
          ))}
        </select>

        <select className="form-select" style={{ maxWidth: 220 }} value={deviceId} onChange={(e) => updateFilter(setDeviceId)(e.target.value)}>
          <option value="">All Devices</option>
          {(devices || []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.deviceName}
            </option>
          ))}
        </select>

        <div className="d-flex align-items-center gap-2">
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={dateFrom} max={dateTo} onChange={(e) => updateFilter(setDateFrom)(e.target.value)} />
          <span style={{ color: 'var(--hz-text-muted)', fontSize: 'var(--hz-text-sm)' }}>to</span>
          <input type="date" className="form-control" style={{ maxWidth: 160 }} value={dateTo} min={dateFrom} onChange={(e) => updateFilter(setDateTo)(e.target.value)} />
        </div>
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          rows={pageRows}
          getRowKey={(s) => getSessionId(s)}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyIcon={ActivityIcon}
          emptyTitle={search ? 'No matching activity on this page' : 'No activity in this range'}
          emptyDescription="Try widening the date range, or clearing the search, employee, and device filters."
        />

        {!isLoading && !isError && totalElements > 0 && (
          <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ borderTop: '1px solid var(--hz-border)' }}>
            <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>
              {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalElements)} of {totalElements}
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
                Page {page + 1} of {totalPages}
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
        )}
      </Card>
    </div>
  );
}
