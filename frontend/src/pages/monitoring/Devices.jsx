import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Eye, Monitor } from 'lucide-react';
import {
  monitoringApi,
  getDeviceId,
  getDeviceName,
  getDeviceEmployeeName,
  isDeviceOnline,
  getDeviceLastSeen,
  getDeviceOS,
  getDeviceAgentVersion,
} from '../../api/endpoints/monitoring';
import { timeAgoIST } from '../../utils/formatDateTime';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

export default function Devices() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['monitoring-devices'], queryFn: monitoringApi.devices, refetchInterval: 30_000 });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter((d) => {
      const online = isDeviceOnline(d);
      if (statusFilter === 'online' && !online) return false;
      if (statusFilter === 'offline' && online) return false;
      if (!q) return true;
      const name = getDeviceName(d).toLowerCase();
      const employee = (getDeviceEmployeeName(d) || '').toLowerCase();
      return name.includes(q) || employee.includes(q);
    });
  }, [data, search, statusFilter]);

  const columns = [
    {
      key: 'device',
      label: 'Device Name',
      headerClassName: 'ps-4',
      className: 'ps-4',
      render: (d) => (
        <Link to={`/monitoring/devices/${getDeviceId(d)}`} className="d-flex align-items-center gap-2 text-decoration-none">
          <div className="hz-stat__icon" style={{ width: 32, height: 32, background: 'var(--hz-primary-50)', color: 'var(--hz-primary-600)' }}>
            <Monitor size={15} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>{getDeviceName(d)}</span>
        </Link>
      ),
    },
    { key: 'employee', label: 'Employee', render: (d) => getDeviceEmployeeName(d) || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (d) => (
        <Badge variant={isDeviceOnline(d) ? 'success' : 'neutral'} dot>
          {isDeviceOnline(d) ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      render: (d) => timeAgoIST(getDeviceLastSeen(d)),
      style: { color: 'var(--hz-text-secondary)' },
    },
    { key: 'os', label: 'Operating System', render: (d) => getDeviceOS(d) },
    { key: 'agentVersion', label: 'Agent Version', render: (d) => getDeviceAgentVersion(d) },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'pe-4',
      className: 'pe-4',
      render: (d) => (
        <Link
          to={`/monitoring/devices/${getDeviceId(d)}`}
          className="hz-icon-btn d-inline-flex align-items-center justify-content-center border-0"
          style={{ width: 32, height: 32 }}
          aria-label={`View ${getDeviceName(d)}`}
        >
          <Eye size={15} />
        </Link>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Monitored Devices</h1>
        <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
          Every device enrolled with the Windows Agent
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap">
        <div className="position-relative" style={{ maxWidth: 360, width: '100%' }}>
          <Search size={16} className="position-absolute" style={{ left: 12, top: 10, color: 'var(--hz-text-muted)' }} />
          <input
            type="search"
            placeholder="Search by device or employee…"
            className="form-control ps-5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          rows={filtered}
          getRowKey={(d) => getDeviceId(d)}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyIcon={Monitor}
          emptyTitle={search || statusFilter !== 'all' ? 'No matching devices' : 'No devices enrolled yet'}
          emptyDescription={
            search || statusFilter !== 'all'
              ? 'Try a different search term or status filter.'
              : "Devices appear here automatically after the Windows Agent's first heartbeat."
          }
        />
      </Card>
    </div>
  );
}
