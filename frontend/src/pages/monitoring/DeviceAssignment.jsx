import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Pencil, Laptop, KeyRound, Trash2 } from 'lucide-react';
import {
  monitoringApi,
  getDeviceName,
  getDeviceEmployeeName,
  getDeviceHostname,
  getDeviceSerialNumber,
  getDeviceDepartment,
  getDeviceDesignation,
  getDeviceEmployeeCode,
} from '../../api/endpoints/monitoring';
import { formatDateIST } from '../../utils/formatDateTime';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import AssignDeviceModal from './components/AssignDeviceModal';
import { useToast } from '../../components/ui/Toast';

/**
 * Requirement #1 - Employee Device Assignment. Each row links a device to
 * Employee ID / Name / Department / Designation / Device Name / Hostname /
 * Serial Number / MAC Address / Assigned Date / Status, all sourced from
 * the real monitored_device table (extended in V11).
 */
export default function DeviceAssignment() {
  const [search, setSearch] = useState('');
  const [modalDevice, setModalDevice] = useState(undefined); // undefined = closed, null = new, object = edit
  const [confirmAction, setConfirmAction] = useState(null);
  const [newToken, setNewToken] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['monitoring-devices'], queryFn: monitoringApi.devices });

  const deleteDevice = useMutation({
    mutationFn: (id) => monitoringApi.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-devices'] });
      toast.success('Device deleted');
      setConfirmAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not delete device'),
  });

  const rotateToken = useMutation({
    mutationFn: (id) => monitoringApi.rotateAdminToken(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-devices'] });
      setConfirmAction(null);
      setNewToken(response?.newToken || null);
      if (!response?.newToken) toast.error('Token rotation succeeded but no token was returned');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Could not rotate token'),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter((d) => {
      const haystack = [
        getDeviceName(d),
        getDeviceEmployeeName(d),
        getDeviceEmployeeCode(d),
        getDeviceHostname(d),
        getDeviceSerialNumber(d),
        getDeviceDepartment(d),
        getDeviceDesignation(d),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, search]);

  const columns = [
    { key: 'employeeId', label: 'Employee ID', headerClassName: 'ps-4', className: 'ps-4', render: (d) => getDeviceEmployeeCode(d) || '—' },
    { key: 'employeeName', label: 'Employee Name', render: (d) => getDeviceEmployeeName(d) || '—' },
    { key: 'department', label: 'Department', render: (d) => getDeviceDepartment(d) },
    { key: 'designation', label: 'Designation', render: (d) => getDeviceDesignation(d) },
    {
      key: 'device',
      label: 'Device Name',
      render: (d) => (
        <span className="d-flex align-items-center gap-2">
          <Laptop size={14} style={{ color: 'var(--hz-text-muted)' }} />
          {getDeviceName(d)}
        </span>
      ),
    },
    { key: 'hostname', label: 'Hostname', render: (d) => getDeviceHostname(d) },
    { key: 'serial', label: 'Serial Number', render: (d) => getDeviceSerialNumber(d) },
    { key: 'mac', label: 'MAC Address', render: (d) => d.macAddress || '—' },
    { key: 'assignedDate', label: 'Assigned Date', render: (d) => (d.assignedDate ? formatDateIST(d.assignedDate) : '—') },
    {
      key: 'status',
      label: 'Status',
      render: (d) => (
        <Badge variant={d.active ? 'success' : 'neutral'} dot>
          {d.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'pe-4',
      className: 'pe-4',
      render: (d) => (
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="hz-icon-btn d-inline-flex align-items-center justify-content-center border-0"
            style={{ width: 32, height: 32 }}
            aria-label={`Edit assignment for ${getDeviceName(d)}`}
            title="Edit assignment"
            onClick={() => setModalDevice(d)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="hz-icon-btn d-inline-flex align-items-center justify-content-center border-0"
            style={{ width: 32, height: 32 }}
            aria-label={`Rotate token for ${getDeviceName(d)}`}
            title="Rotate token"
            onClick={() => setConfirmAction({ type: 'rotate', device: d })}
          >
            <KeyRound size={15} />
          </button>
          <button
            type="button"
            className="hz-icon-btn d-inline-flex align-items-center justify-content-center border-0 text-danger"
            style={{ width: 32, height: 32 }}
            aria-label={`Delete ${getDeviceName(d)}`}
            title="Delete device"
            onClick={() => setConfirmAction({ type: 'delete', device: d })}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Device Assignment</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Employee-to-device mapping for every enrolled monitoring agent
          </p>
        </div>
        <Button icon={Plus} onClick={() => setModalDevice(null)}>
          Assign New Device
        </Button>
      </div>

      <div className="position-relative" style={{ maxWidth: 420, width: '100%' }}>
        <Search size={16} className="position-absolute" style={{ left: 12, top: 10, color: 'var(--hz-text-muted)' }} />
        <input
          type="search"
          placeholder="Search by employee, device, hostname, serial…"
          className="form-control ps-5"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          rows={filtered}
          getRowKey={(d) => d.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          emptyIcon={Laptop}
          emptyTitle={search ? 'No matching devices' : 'No devices assigned yet'}
          emptyDescription={search ? 'Try a different search term.' : 'Assign a device to an employee to get started.'}
        />
      </Card>

      {modalDevice !== undefined && (
        <AssignDeviceModal
          device={modalDevice}
          onClose={(changed) => {
            setModalDevice(undefined);
            if (changed) refetch();
          }}
        />
      )}

      {confirmAction && (
        <Dialog
          open
          title={confirmAction.type === 'delete' ? 'Delete Device' : 'Rotate Agent Token'}
          onClose={() => setConfirmAction(null)}
          footer={(
            <>
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                variant={confirmAction.type === 'delete' ? 'danger' : 'primary'}
                icon={confirmAction.type === 'delete' ? Trash2 : KeyRound}
                loading={deleteDevice.isPending || rotateToken.isPending}
                onClick={() => {
                  if (confirmAction.type === 'delete') {
                    deleteDevice.mutate(confirmAction.device.id);
                  } else {
                    rotateToken.mutate(confirmAction.device.id);
                  }
                }}
              >
                {confirmAction.type === 'delete' ? 'Delete' : 'Rotate Token'}
              </Button>
            </>
          )}
        >
          <p>
            {confirmAction.type === 'delete'
              ? 'Are you sure you want to delete this device?'
              : 'Rotating the token will invalidate the current agent token. Continue?'}
          </p>
        </Dialog>
      )}

      {newToken && (
        <Dialog open title="New Agent Token" onClose={() => setNewToken(null)}>
          <p className="text-secondary-hz">Copy this token now. It will not be shown again.</p>
          <div className="p-3 my-3" style={{ background: 'var(--hz-neutral-50)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}>
            {newToken}
          </div>
          <div className="d-flex justify-content-end gap-2">
            <Button
              icon={KeyRound}
              onClick={() => {
                navigator.clipboard?.writeText(newToken);
                toast.success('Token copied to clipboard');
              }}
            >
              Copy Token
            </Button>
            <Button variant="secondary" onClick={() => setNewToken(null)}>Done</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
