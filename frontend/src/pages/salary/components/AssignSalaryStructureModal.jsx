import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { salaryStructuresApi } from '../../../api/endpoints/salary';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { formatCurrency } from '../../../utils/formatCurrency';
import SalaryComponentsFields, { EMPTY_COMPONENTS, computeTotals } from './SalaryComponentsFields';

/**
 * Defines a new salary structure for an employee, or revises an existing
 * one. A revision is submitted as a brand-new structure (see
 * SalaryStructureService.upsert on the backend) - it never edits history,
 * so past payroll runs stay exactly as they were.
 *
 * `employee` only needs { employeeId | id, employeeName | fullName,
 * employeeCode? } - the modal fetches the current structure itself so
 * callers (list, details, structure pages) don't each need to know it.
 */
export default function AssignSalaryStructureModal({ employee, onClose }) {
  const employeeId = employee.employeeId ?? employee.id;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [components, setComponents] = useState(EMPTY_COMPONENTS);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const { data: currentStructure, isLoading: loadingCurrent } = useQuery({
    queryKey: ['salary-structure-current', employeeId],
    queryFn: () => salaryStructuresApi.getCurrent(employeeId),
    enabled: !!employeeId,
  });

  useEffect(() => {
    if (!touched && currentStructure?.components) {
      setComponents({ ...currentStructure.components });
      setNotes(currentStructure.notes || '');
    }
  }, [currentStructure, touched]);

  const totals = computeTotals(components);

  const upsert = useMutation({
    mutationFn: salaryStructuresApi.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-employees'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structure-current', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['salary-employee-detail', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['salary-dashboard-summary'] });
      toast.success(`Salary structure saved for ${employee.employeeName ?? employee.fullName}`);
      onClose(true);
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not save the salary structure'),
  });

  function set(key, value) {
    setTouched(true);
    setComponents((c) => ({ ...c, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!components.basicSalary || Number(components.basicSalary) <= 0) {
      setError('Basic salary must be greater than zero');
      return;
    }
    upsert.mutate({
      employeeId,
      effectiveFrom,
      notes,
      components,
    });
  }

  const employeeName = employee.employeeName ?? employee.fullName;
  const employeeCode = employee.employeeCode;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={() => onClose(false)}
    >
      <div className="hz-surface d-flex flex-column" style={{ width: 760, maxHeight: '92vh', padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>
              {currentStructure ? 'Revise Salary Structure' : loadingCurrent ? 'Salary Structure' : 'Define Salary Structure'}
            </h3>
            <p className="text-secondary-hz mb-0" style={{ fontSize: 'var(--hz-text-sm)' }}>
              {employeeName} {employeeCode ? `\u00b7 ${employeeCode}` : ''}
            </p>
          </div>
          <button className="btn btn-light border-0 p-1" onClick={() => onClose(false)}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-auto">
          {error && (
            <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          {loadingCurrent ? (
            <div className="py-5 text-center" style={{ color: 'var(--hz-text-muted)', fontSize: 13 }}>
              Loading current structure…
            </div>
          ) : (
            <>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                    Effective From
                  </label>
                  <input type="date" className="form-control" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                    Notes (optional)
                  </label>
                  <input type="text" className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Annual appraisal revision" />
                </div>
              </div>

              <SalaryComponentsFields components={components} onChange={set} />

              <div
                className="d-flex align-items-center justify-content-between mt-4 p-3"
                style={{ background: 'var(--hz-gradient-surface)', border: '1px solid var(--hz-border)', borderRadius: 'var(--hz-radius-lg)' }}
              >
                <TotalTile label="Gross Salary" value={totals.gross} />
                <TotalTile label="Total Deductions" value={totals.deductions} muted />
                <TotalTile label="Net Salary" value={totals.net} emphasize />
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="secondary" type="button" onClick={() => onClose(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={upsert.isPending}>
                  {currentStructure ? 'Save Revision' : 'Save Structure'}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function TotalTile({ label, value, muted, emphasize }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--hz-text-muted)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p
        style={{
          fontSize: emphasize ? 'var(--hz-text-xl)' : 'var(--hz-text-lg)',
          fontWeight: 700,
          margin: 0,
          color: muted ? 'var(--hz-danger-600)' : emphasize ? 'var(--hz-primary-700)' : 'var(--hz-text-primary)',
        }}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
