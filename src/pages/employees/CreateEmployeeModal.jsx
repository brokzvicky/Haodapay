import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { employeesApi } from '../../api/endpoints/employees';
import { departmentsApi, designationsApi, teamsApi } from '../../api/endpoints/organization';
import Button from '../../components/ui/Button';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  dateOfJoining: '',
  employmentType: 'FULL_TIME',
  departmentId: '',
  designationId: '',
  teamId: '',
  reportingManagerId: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export default function CreateEmployeeModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list });
  const { data: designations = [] } = useQuery({ queryKey: ['designations'], queryFn: designationsApi.list });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.list });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });

  const createEmployee = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not create employee'),
  });

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const payload = {
      ...form,
      departmentId: form.departmentId || null,
      designationId: form.designationId || null,
      teamId: form.teamId || null,
      reportingManagerId: form.reportingManagerId || null,
      dateOfBirth: form.dateOfBirth || null,
    };
    createEmployee.mutate(payload);
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div
        className="hz-surface d-flex flex-column"
        style={{ width: 640, maxHeight: '90vh', padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Onboard Employee</h3>
            <p className="text-secondary-hz mb-0" style={{ fontSize: 'var(--hz-text-sm)' }}>
              An employee code is generated automatically
            </p>
          </div>
          <button className="btn btn-light border-0 p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-auto">
          {error && (
            <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          <SectionLabel>Personal</SectionLabel>
          <div className="row g-3 mb-3">
            <Field col={6} label="First Name" value={form.firstName} onChange={(v) => set('firstName', v)} required />
            <Field col={6} label="Last Name" value={form.lastName} onChange={(v) => set('lastName', v)} required />
            <Field col={6} label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} required />
            <Field col={6} label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
            <Field col={6} label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => set('dateOfBirth', v)} />
            <Field col={6} label="Gender" value={form.gender} onChange={(v) => set('gender', v)} />
          </div>

          <SectionLabel>Employment</SectionLabel>
          <div className="row g-3 mb-3">
            <Field col={6} label="Date of Joining" type="date" value={form.dateOfJoining} onChange={(v) => set('dateOfJoining', v)} required />
            <SelectField col={6} label="Employment Type" value={form.employmentType} onChange={(v) => set('employmentType', v)}>
              <option value="FULL_TIME">Full-Time</option>
              <option value="PART_TIME">Part-Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </SelectField>
            <SelectField col={6} label="Department" value={form.departmentId} onChange={(v) => set('departmentId', v)}>
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </SelectField>
            <SelectField col={6} label="Designation" value={form.designationId} onChange={(v) => set('designationId', v)}>
              <option value="">—</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </SelectField>
            <SelectField col={6} label="Team" value={form.teamId} onChange={(v) => set('teamId', v)}>
              <option value="">—</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </SelectField>
            <SelectField col={6} label="Reporting Manager" value={form.reportingManagerId} onChange={(v) => set('reportingManagerId', v)}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </SelectField>
          </div>

          <SectionLabel>Emergency Contact</SectionLabel>
          <div className="row g-3 mb-1">
            <Field col={12} label="Address" value={form.address} onChange={(v) => set('address', v)} />
            <Field col={6} label="Contact Name" value={form.emergencyContactName} onChange={(v) => set('emergencyContactName', v)} />
            <Field col={6} label="Contact Phone" value={form.emergencyContactPhone} onChange={(v) => set('emergencyContactPhone', v)} />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createEmployee.isPending}>
              Onboard Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      className="text-uppercase mb-2"
      style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--hz-text-muted)', fontWeight: 600 }}
    >
      {children}
    </p>
  );
}

function Field({ label, value, onChange, type = 'text', required, col = 6 }) {
  return (
    <div className={`col-${col}`}>
      <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
        {label}
      </label>
      <input type={type} className="form-control" value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

function SelectField({ label, value, onChange, col = 6, children }) {
  return (
    <div className={`col-${col}`}>
      <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
        {label}
      </label>
      <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}
