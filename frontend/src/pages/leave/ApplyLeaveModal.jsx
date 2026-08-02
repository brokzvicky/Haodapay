import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { leaveRequestsApi, leaveTypesApi } from '../../api/endpoints/leave';
import { employeesApi } from '../../api/endpoints/employees';
import Button from '../../components/ui/Button';

export default function ApplyLeaveModal({ onClose, defaultEmployeeId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId || '',
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [error, setError] = useState(null);

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });
  const { data: leaveTypes = [] } = useQuery({ queryKey: ['leave-types'], queryFn: leaveTypesApi.list });

  const year = form.startDate ? new Date(form.startDate).getFullYear() : new Date().getFullYear();
  const { data: balances } = useQuery({
    queryKey: ['leave-balance', form.employeeId, year],
    queryFn: () => leaveRequestsApi.balance(form.employeeId, year),
    enabled: !!form.employeeId,
  });

  const selectedBalance = useMemo(
    () => balances?.find((b) => String(b.leaveTypeId) === String(form.leaveTypeId)),
    [balances, form.leaveTypeId]
  );

  const apply = useMutation({
    mutationFn: leaveRequestsApi.apply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not submit leave request'),
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    apply.mutate(form);
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 460, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Apply Leave</h3>
          <button className="btn btn-light border-0 p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
              Employee
            </label>
            <select className="form-select" value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} required>
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
              Leave Type
            </label>
            <select className="form-select" value={form.leaveTypeId} onChange={(e) => set('leaveTypeId', e.target.value)} required>
              <option value="">Select leave type</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedBalance && (
              <p className="mb-0 mt-1" style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>
                {selectedBalance.remainingDays} of {selectedBalance.allocatedDays + selectedBalance.carriedForwardDays} day(s) remaining in {year}
              </p>
            )}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Start Date
              </label>
              <input type="date" className="form-control" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                End Date
              </label>
              <input type="date" className="form-control" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
            </div>
          </div>

          <div className="mb-1">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
              Reason (optional)
            </label>
            <textarea className="form-control" rows={2} value={form.reason} onChange={(e) => set('reason', e.target.value)} />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={apply.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
