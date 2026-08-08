import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { payrollApi } from '../../../api/endpoints/salary';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function NewPayrollRunModal({ onClose }) {
  const now = new Date();
  const toast = useToast();
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [payDate, setPayDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState(null);

  const createRun = useMutation({
    mutationFn: payrollApi.createRun,
    onSuccess: (data) => {
      toast.success(`Payroll run opened for ${MONTHS[periodMonth - 1]} ${periodYear}`);
      onClose(data.run.id);
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not create this payroll run'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    createRun.mutate({ periodMonth, periodYear, payDate: payDate || null, remarks });
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={() => onClose(null)}
    >
      <div className="hz-surface d-flex flex-column" style={{ width: 480, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>New Payroll Run</h3>
            <p className="text-secondary-hz mb-0" style={{ fontSize: 'var(--hz-text-sm)' }}>
              Every actively-paid employee is included automatically
            </p>
          </div>
          <button className="btn btn-light border-0 p-1" onClick={() => onClose(null)}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-7">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Period Month
              </label>
              <select className="form-select" value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-5">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Year
              </label>
              <input type="number" className="form-control" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} />
            </div>
            <div className="col-12">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Planned Pay Date (optional)
              </label>
              <input type="date" className="form-control" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Remarks (optional)
              </label>
              <input type="text" className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="secondary" type="button" onClick={() => onClose(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={createRun.isPending}>
              Open Run
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
