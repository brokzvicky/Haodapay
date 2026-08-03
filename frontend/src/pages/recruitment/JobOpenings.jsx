import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { jobOpeningsApi } from '../../api/endpoints/recruitment';
import { departmentsApi, designationsApi } from '../../api/endpoints/organization';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STATUS_VARIANT = { OPEN: 'success', ON_HOLD: 'warning', CLOSED: 'neutral' };

export default function JobOpenings() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: openings, isLoading, isError, refetch } = useQuery({ queryKey: ['job-openings'], queryFn: jobOpeningsApi.list });

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>Recruitment</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            Job openings and candidate pipelines
          </p>
        </div>
        <Button icon={Plus} onClick={() => setShowCreate(true)}>
          New Requisition
        </Button>
      </div>

      {isError && <ErrorState description="Couldn't load job openings." onRetry={refetch} />}

      {!isError && (
        <div className="row g-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div className="col-12 col-md-6 col-xl-4" key={i}>
                <SkeletonCard />
              </div>
            ))}

          {!isLoading && openings?.length === 0 && (
            <div className="col-12">
              <Card>
                <EmptyState title="No job openings yet" description="Create a requisition to start building a candidate pipeline." />
              </Card>
            </div>
          )}

          {!isLoading &&
            openings?.map((o) => (
              <div className="col-12 col-md-6 col-xl-4" key={o.id}>
                <Link to={`/recruitment/${o.id}`} className="text-decoration-none">
                  <Card hoverable>
                    <div className="d-flex align-items-start justify-content-between mb-2">
                      <h3 style={{ fontSize: 'var(--hz-text-base)', fontWeight: 600, color: 'var(--hz-text-primary)', margin: 0 }}>{o.title}</h3>
                      <Badge variant={STATUS_VARIANT[o.status]} dot>
                        {o.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)', marginBottom: 12 }}>
                      {o.departmentName || 'Any department'} {o.designationTitle ? `· ${o.designationTitle}` : ''}
                    </p>
                    <div className="d-flex justify-content-between" style={{ fontSize: 'var(--hz-text-sm)' }}>
                      <span style={{ color: 'var(--hz-text-muted)' }}>{o.openingsCount} opening(s)</span>
                      <span>
                        <strong>{o.candidateCount}</strong> candidate(s) · <strong>{o.hiredCount}</strong> hired
                      </span>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}
        </div>
      )}

      {showCreate && <CreateJobOpeningModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateJobOpeningModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', departmentId: '', designationId: '', employmentType: 'FULL_TIME', openingsCount: 1, description: '' });
  const [error, setError] = useState(null);

  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: departmentsApi.list });
  const { data: designations = [] } = useQuery({ queryKey: ['designations'], queryFn: designationsApi.list });

  const create = useMutation({
    mutationFn: jobOpeningsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not create job opening'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    create.mutate({
      ...form,
      departmentId: form.departmentId || null,
      designationId: form.designationId || null,
      openingsCount: Number(form.openingsCount),
    });
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 480, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>New Requisition</h3>
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
              Job Title
            </label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Department
              </label>
              <select className="form-select" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Designation
              </label>
              <select className="form-select" value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })}>
                <option value="">—</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Employment Type
              </label>
              <select className="form-select" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
                Number of Openings
              </label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={form.openingsCount}
                onChange={(e) => setForm({ ...form, openingsCount: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-1">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
              Description
            </label>
            <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create Requisition
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
