import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, CalendarClock, X } from 'lucide-react';
import { candidatesApi, interviewsApi, jobOpeningsApi } from '../../api/endpoints/recruitment';
import { employeesApi } from '../../api/endpoints/employees';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { SkeletonText } from '../../components/ui/Skeleton';

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const STAGE_VARIANT = { APPLIED: 'neutral', SCREENING: 'info', INTERVIEW: 'primary', OFFER: 'warning', HIRED: 'success', REJECTED: 'danger' };

export default function CandidatePipeline() {
  const { jobOpeningId } = useParams();
  const queryClient = useQueryClient();
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [schedulingFor, setSchedulingFor] = useState(null);

  const { data: openings } = useQuery({ queryKey: ['job-openings'], queryFn: jobOpeningsApi.list });
  const opening = openings?.find((o) => String(o.id) === jobOpeningId);

  const { data: candidates, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidates', jobOpeningId],
    queryFn: () => candidatesApi.list(jobOpeningId),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }) => candidatesApi.updateStage(id, { stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobOpeningId] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    },
  });

  return (
    <div className="d-flex flex-column gap-4">
      <Link to="/recruitment" className="d-inline-flex align-items-center gap-1 text-decoration-none" style={{ color: 'var(--hz-text-secondary)', fontSize: 'var(--hz-text-sm)', width: 'fit-content' }}>
        <ArrowLeft size={15} /> Back to Job Openings
      </Link>

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h1 style={{ fontSize: 'var(--hz-text-2xl)', fontWeight: 700 }}>{opening?.title || 'Candidate Pipeline'}</h1>
          <p className="text-secondary-hz" style={{ fontSize: 'var(--hz-text-sm)' }}>
            {opening?.departmentName || 'Any department'} {opening?.designationTitle ? `· ${opening.designationTitle}` : ''}
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowAddCandidate(true)}>
          Add Candidate
        </Button>
      </div>

      <Card bodyClassName="p-0">
        {isLoading && (
          <div className="p-4">
            <SkeletonText lines={5} />
          </div>
        )}
        {isError && <ErrorState description="Couldn't load candidates." onRetry={refetch} />}
        {!isLoading && !isError && candidates?.length === 0 && (
          <EmptyState title="No candidates yet" description="Add a candidate to start the pipeline for this role." />
        )}
        {!isLoading && !isError && candidates?.length > 0 && (
          <table className="table mb-0 align-middle">
            <thead>
              <tr style={{ fontSize: 'var(--hz-text-xs)', color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>
                <th className="ps-4">Candidate</th>
                <th>Source</th>
                <th>Applied</th>
                <th>Stage</th>
                <th className="pe-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-2">
                      <Avatar name={c.fullName} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)' }}>{c.fullName}</div>
                        <div style={{ fontSize: 12, color: 'var(--hz-text-muted)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 'var(--hz-text-sm)' }}>{c.source || '—'}</td>
                  <td style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{new Date(c.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 140 }}
                      value={c.stage}
                      onChange={(e) => updateStage.mutate({ id: c.id, stage: e.target.value })}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="pe-4 text-end">
                    <Button variant="secondary" size="sm" icon={CalendarClock} onClick={() => setSchedulingFor(c)}>
                      Interview
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showAddCandidate && <AddCandidateModal jobOpeningId={jobOpeningId} onClose={() => setShowAddCandidate(false)} />}
      {schedulingFor && <ScheduleInterviewModal candidate={schedulingFor} onClose={() => setSchedulingFor(null)} />}
    </div>
  );
}

function AddCandidateModal({ jobOpeningId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', source: '', resumeUrl: '' });
  const [error, setError] = useState(null);

  const create = useMutation({
    mutationFn: candidatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', jobOpeningId] });
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not add candidate'),
  });

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div className="hz-surface" style={{ width: 420, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Add Candidate</h3>
          <button className="btn btn-light border-0 p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          className="p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            create.mutate({ ...form, jobOpeningId: Number(jobOpeningId) });
          }}
        >
          {error && (
            <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>First Name</label>
              <input className="form-control" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Last Name</label>
              <input className="form-control" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Email</label>
            <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="row g-3 mb-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Source</label>
              <input className="form-control" placeholder="Referral, LinkedIn…" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </div>
          </div>
          <div className="mb-1">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Resume URL</label>
            <input className="form-control" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={create.isPending}>Add Candidate</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ScheduleInterviewModal({ candidate, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ scheduledAt: '', interviewerId: '', mode: 'VIDEO' });
  const [error, setError] = useState(null);

  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });

  const schedule = useMutation({
    mutationFn: interviewsApi.schedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not schedule interview'),
  });

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div className="hz-surface" style={{ width: 400, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Schedule Interview</h3>
          <button className="btn btn-light border-0 p-1" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          className="p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            schedule.mutate({ ...form, candidateId: candidate.id, interviewerId: form.interviewerId || null });
          }}
        >
          {error && (
            <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}
          <p style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>For {candidate.fullName}</p>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Date & Time</label>
            <input type="datetime-local" className="form-control" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Interviewer</label>
            <select className="form-select" value={form.interviewerId} onChange={(e) => setForm({ ...form, interviewerId: e.target.value })}>
              <option value="">—</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>
          <div className="mb-1">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Mode</label>
            <select className="form-select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              <option value="VIDEO">Video</option>
              <option value="ONSITE">Onsite</option>
              <option value="PHONE">Phone</option>
            </select>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={schedule.isPending}>Schedule</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
