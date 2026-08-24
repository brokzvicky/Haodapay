import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, XCircle } from 'lucide-react';
import { jobOpeningsApi } from '../../api/endpoints/recruitment';
import { departmentsApi, designationsApi } from '../../api/endpoints/organization';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Dialog from '../../components/ui/Dialog';
import FormField from '../../components/ui/FormField';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STATUS_VARIANT = { OPEN: 'success', ON_HOLD: 'warning', CLOSED: 'neutral' };
const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function JobOpenings() {
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const queryClient = useQueryClient();
  const deleteOpening = useMutation({
    mutationFn: () => jobOpeningsApi.delete(deleteTarget.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      setDeleteTarget(null);
    },
  });
  const { data: openings, isLoading, isError, error, refetch } = useQuery({ queryKey: ['job-openings'], queryFn: jobOpeningsApi.list });

  // Client-side, not a new backend query param: the requisition list for
  // any one company is small enough (dozens, not thousands) that fetching
  // everything once and narrowing it here is simpler than adding
  // status/search params to an endpoint that's never needed them before -
  // unlike the Employee Directory, which genuinely needed server-side
  // paging at scale.
  const filteredOpenings = useMemo(() => {
    if (!openings) return openings;
    return openings.filter((o) => {
      if (status && o.status !== status) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!o.title.toLowerCase().includes(q) && !(o.departmentName || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [openings, status, search]);

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

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className="btn btn-sm"
              style={{
                fontWeight: 600,
                fontSize: 'var(--hz-text-sm)',
                color: status === t.key ? '#fff' : 'var(--hz-text-secondary)',
                background: status === t.key ? 'var(--hz-primary-600)' : 'var(--hz-gray-50)',
                border: '1px solid ' + (status === t.key ? 'var(--hz-primary-600)' : 'var(--hz-border)'),
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="position-relative" style={{ width: 240 }}>
          <Search size={14} className="position-absolute" style={{ left: 10, top: 9, color: 'var(--hz-text-muted)' }} />
          <input
            type="search"
            placeholder="Search title or department…"
            className="form-control form-control-sm ps-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isError && <ErrorState description={error?.response?.data?.message || error?.message || "Couldn't load job openings."} onRetry={refetch} />}

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

          {!isLoading && openings?.length > 0 && filteredOpenings?.length === 0 && (
            <div className="col-12">
              <Card>
                <EmptyState title="No matches" description="Try a different status or search term." />
              </Card>
            </div>
          )}

          {!isLoading &&
            filteredOpenings?.map((o) => (
              <div className="col-12 col-md-6 col-xl-4" key={o.id}>
                <Card hoverable className="h-100 d-flex flex-column">
                  <Link to={`/recruitment/${o.id}`} className="text-decoration-none flex-grow-1">
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
                    {o.status === 'CLOSED' && o.closedReason && (
                      <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--hz-border-light)', fontSize: 12, color: 'var(--hz-text-secondary)' }}>
                        <strong>Closed:</strong> {o.closedReason.replaceAll('_', ' ').toLowerCase()} {o.closedAt ? `· ${new Date(o.closedAt).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </Link>
                  <div className="d-flex align-items-center justify-content-end gap-2 px-4 pb-4 pt-2">
                    {o.status === 'OPEN' && <button type="button" className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1" title="Close requisition" onClick={() => setCloseTarget(o)}><XCircle size={14} /> Close</button>}
                    <button type="button" className="hz-icon-btn d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }} aria-label={`Delete ${o.title}`} title="Delete requisition" onClick={() => setDeleteTarget(o)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              </div>
            ))}
        </div>
      )}

      {showCreate && <CreateJobOpeningModal onClose={() => setShowCreate(false)} />}
      {deleteTarget && <Dialog open onClose={() => !deleteOpening.isPending && setDeleteTarget(null)} title="Delete requisition" description={`Delete “${deleteTarget.title}”?`}>
        <p className="text-secondary-hz mb-4">This removes the requisition from the list. Candidate history is preserved, but requisitions with candidates cannot be deleted.</p>
        {deleteOpening.isError && <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>{deleteOpening.error?.response?.data?.message || 'Could not delete requisition.'}</div>}
        <div className="d-flex justify-content-end gap-2"><Button variant="secondary" type="button" disabled={deleteOpening.isPending} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" type="button" loading={deleteOpening.isPending} onClick={() => deleteOpening.mutate()}>Delete</Button></div>
      </Dialog>}
      {closeTarget && <CloseRequisitionModal opening={closeTarget} onClose={() => setCloseTarget(null)} />}
    </div>
  );
}

function CloseRequisitionModal({ opening, onClose }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const close = useMutation({
    mutationFn: () => jobOpeningsApi.close(opening.id, { reason, comments: comments.trim() || null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job-openings'] }); onClose(); },
    onError: (err) => setError(err.response?.data?.message || 'Could not close requisition'),
  });
  return <Dialog open onClose={() => !close.isPending && onClose()} title="Close Requisition" description={opening.title}>
    <form onSubmit={(event) => { event.preventDefault(); if (!reason) { setError('Select a close reason'); return; } setError(''); close.mutate(); }}>
      {error && <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>{error}</div>}
      <FormField as="select" label="Reason" value={reason} onChange={setReason} required>
        <option value="">Select a reason</option><option value="POSITION_FILLED">Position filled</option><option value="HIRING_CANCELLED">Hiring cancelled</option><option value="BUDGET_ON_HOLD">Budget on hold</option><option value="DUPLICATE_REQUISITION">Duplicate requisition</option><option value="OTHER">Other</option>
      </FormField>
      <FormField as="textarea" label="Comments (optional)" rows={4} value={comments} onChange={setComments} maxLength={1000} />
      <div className="d-flex justify-content-end gap-2 mt-3"><Button variant="secondary" type="button" disabled={close.isPending} onClick={onClose}>Cancel</Button><Button variant="danger" type="submit" loading={close.isPending}>Close Requisition</Button></div>
    </form>
  </Dialog>;
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

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <Dialog open onClose={onClose} title="New Requisition" size="md">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}
        <FormField label="Job Title" value={form.title} onChange={(v) => set('title', v)} required />
        <div className="row g-3 mb-3">
          <FormField as="select" col={6} label="Department" value={form.departmentId} onChange={(v) => set('departmentId', v)}>
            <option value="">—</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FormField>
          <FormField as="select" col={6} label="Designation" value={form.designationId} onChange={(v) => set('designationId', v)}>
            <option value="">—</option>
            {designations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </FormField>
        </div>
        <div className="row g-3 mb-3">
          <FormField as="select" col={6} label="Employment Type" value={form.employmentType} onChange={(v) => set('employmentType', v)}>
            <option value="FULL_TIME">Full-Time</option>
            <option value="PART_TIME">Part-Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
          </FormField>
          <FormField col={6} label="Number of Openings" type="number" min={1} value={form.openingsCount} onChange={(v) => set('openingsCount', v)} />
        </div>
        <FormField as="textarea" label="Description" rows={3} value={form.description} onChange={(v) => set('description', v)} />
        <div className="d-flex justify-content-end gap-2 mt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create Requisition
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
