import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../../../api/endpoints/monitoring';
import { employeesApi } from '../../../api/endpoints/employees';
import Dialog from '../../../components/ui/Dialog';
import FormField from '../../../components/ui/FormField';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

/**
 * Handles both halves of requirement #1 (Employee Device Assignment):
 * enrolling a brand-new device against an employee, and editing/re-assigning
 * an already-enrolled one. `device` is null for "new", or a MonitoredDeviceDTO
 * for "edit" - the two only differ in which API call gets fired and whether
 * a one-time enrollment token gets shown back to the admin afterwards.
 */
export default function AssignDeviceModal({ device, onClose }) {
  const isEdit = !!device;
  const queryClient = useQueryClient();
  const toast = useToast();

  const [form, setForm] = useState({
    deviceName: device?.deviceName || '',
    employeeId: device?.employeeId ? String(device.employeeId) : '',
    hostname: device?.hostname || '',
    serialNumber: device?.serialNumber || '',
    macAddress: device?.macAddress || '',
    assignedDate: device?.assignedDate || new Date().toISOString().slice(0, 10),
    active: device ? device.active : true,
  });
  const [error, setError] = useState(null);
  const [issuedToken, setIssuedToken] = useState(null);

  const { data: employees } = useQuery({ queryKey: ['employees-directory'], queryFn: () => employeesApi.list() });

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const enroll = useMutation({
    mutationFn: monitoringApi.enrollDevice,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-devices'] });
      toast.success(`Device "${form.deviceName}" enrolled`);
      setIssuedToken(res?.rawToken || null);
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not enroll this device'),
  });

  const updateAssignment = useMutation({
    mutationFn: (payload) => monitoringApi.updateAssignment(device.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-devices'] });
      toast.success(`Assignment updated for "${form.deviceName}"`);
      onClose(true);
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not update this assignment'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.deviceName.trim()) {
      setError('Device name is required');
      return;
    }

    if (isEdit) {
      updateAssignment.mutate({
        employeeId: form.employeeId ? Number(form.employeeId) : null,
        hostname: form.hostname || null,
        serialNumber: form.serialNumber || null,
        macAddress: form.macAddress || null,
        assignedDate: form.assignedDate || null,
        active: form.active,
      });
    } else {
      enroll.mutate({
        deviceName: form.deviceName,
        employeeId: form.employeeId ? Number(form.employeeId) : null,
        hostname: form.hostname || null,
        serialNumber: form.serialNumber || null,
        macAddress: form.macAddress || null,
        assignedDate: form.assignedDate || null,
      });
    }
  }

  const saving = enroll.isPending || updateAssignment.isPending;

  // After a successful enrollment, show the one-time agent token instead of
  // closing immediately - it's never retrievable again (see
  // DeviceEnrollmentService.enroll's javadoc), so the admin needs the
  // chance to actually copy it.
  if (issuedToken) {
    return (
      <Dialog open onClose={() => onClose(true)} title="Device Enrolled" size="md">
        <p style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
          Copy this agent token now — it won't be shown again. Paste it into the Windows Agent installer
          (provision-config.ps1 -AgentToken) on <strong>{form.deviceName}</strong>.
        </p>
        <div
          className="p-3 my-3"
          style={{ background: 'var(--hz-neutral-50)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}
        >
          {issuedToken}
        </div>
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(issuedToken);
              toast.success('Token copied to clipboard');
            }}
          >
            Copy Token
          </Button>
          <Button type="button" onClick={() => onClose(true)}>
            Done
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      onClose={() => onClose(false)}
      title={isEdit ? 'Edit Device Assignment' : 'Assign New Device'}
      description={isEdit ? device.deviceName : 'Enroll a device and link it to an employee'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            className="mb-3 px-3 py-2"
            style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}
          >
            {error}
          </div>
        )}

        <div className="row">
          <FormField col={6} label="Device Name" value={form.deviceName} onChange={set('deviceName')} required disabled={isEdit} />
          <FormField as="select" col={6} label="Assigned Employee" value={form.employeeId} onChange={set('employeeId')}>
            <option value="">— Unassigned —</option>
            {(employees || []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeCode})
              </option>
            ))}
          </FormField>
        </div>

        <div className="row">
          <FormField col={6} label="Hostname" value={form.hostname} onChange={set('hostname')} placeholder="e.g. DESKTOP-4F2K9A1" />
          <FormField col={6} label="Serial Number" value={form.serialNumber} onChange={set('serialNumber')} placeholder="Chassis serial" />
        </div>

        <div className="row">
          <FormField col={6} label="MAC Address" value={form.macAddress} onChange={set('macAddress')} placeholder="AA:BB:CC:DD:EE:FF" />
          <FormField type="date" col={6} label="Assigned Date" value={form.assignedDate} onChange={set('assignedDate')} />
        </div>

        {isEdit && (
          <FormField as="select" col={6} label="Status" value={form.active ? 'true' : 'false'} onChange={(v) => set('active')(v === 'true')}>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </FormField>
        )}

        <div className="d-flex justify-content-end gap-2 mt-2">
          <Button variant="secondary" type="button" onClick={() => onClose(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save Changes' : 'Enroll Device'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
