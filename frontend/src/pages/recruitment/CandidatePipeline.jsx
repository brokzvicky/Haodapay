import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Briefcase } from 'lucide-react';
import { candidatesApi, jobOpeningsApi } from '../../api/endpoints/recruitment';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Dialog from '../../components/ui/Dialog';
import FormField from '../../components/ui/FormField';
import { SkeletonText } from '../../components/ui/Skeleton';
import CandidateDetailModal from './CandidateDetailModal';
import { useBreadcrumbLabel } from '../../components/layout/BreadcrumbContext';

// Main flow left to right, then the two exception/terminal columns
// (On Hold, Rejected) pinned at the end - a candidate can land in either
// from several different stages, so they don't fit linearly in the flow.
const STAGE_COLUMNS = [
  'APPLIED', 'SHORTLISTED', 'ROUND1', 'ROUND2', 'ROUND3',
  'OFFERED', 'OFFER_LETTER_SENT', 'HIRED', 'HOLD', 'REJECTED',
];
const STAGE_LABEL = {
  APPLIED: 'Applied', SHORTLISTED: 'Shortlisted', HOLD: 'On Hold',
  ROUND1: 'Round 1', ROUND2: 'Round 2', ROUND3: 'Round 3',
  OFFERED: 'Offered', OFFER_LETTER_SENT: 'Offer Sent', HIRED: 'Hired', REJECTED: 'Rejected',
};
const STAGE_ACCENT = {
  APPLIED: 'var(--hz-gray-400)', SHORTLISTED: 'var(--hz-info-500)', HOLD: 'var(--hz-warning-500)',
  ROUND1: 'var(--hz-primary-500)', ROUND2: 'var(--hz-primary-500)', ROUND3: 'var(--hz-primary-500)',
  OFFERED: 'var(--hz-warning-500)', OFFER_LETTER_SENT: 'var(--hz-primary-500)',
  HIRED: 'var(--hz-success-500)', REJECTED: 'var(--hz-danger-500)',
};

export default function CandidatePipeline() {
  const { jobOpeningId } = useParams();
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const { data: openings } = useQuery({ queryKey: ['job-openings'], queryFn: jobOpeningsApi.list });
  const opening = openings?.find((o) => String(o.id) === jobOpeningId);

  useBreadcrumbLabel(opening?.title);

  const { data: candidates, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidates', jobOpeningId],
    queryFn: () => candidatesApi.list(jobOpeningId),
  });

  const columns = useMemo(() => {
    const byStage = Object.fromEntries(STAGE_COLUMNS.map((s) => [s, []]));
    (candidates || []).forEach((c) => {
      (byStage[c.stage] || (byStage[c.stage] = [])).push(c);
    });
    return byStage;
  }, [candidates]);

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
            {candidates ? ` · ${candidates.length} candidate${candidates.length === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowAddCandidate(true)}>
          Add Candidate
        </Button>
      </div>

      {isLoading && (
        <Card>
          <SkeletonText lines={5} />
        </Card>
      )}
      {isError && (
        <Card>
          <ErrorState description="Couldn't load candidates." onRetry={refetch} />
        </Card>
      )}
      {!isLoading && !isError && candidates?.length === 0 && (
        <Card>
          <EmptyState
            icon={Briefcase}
            title="No candidates yet"
            description="Candidates who apply via the Careers page will appear here automatically, or add one manually."
          />
        </Card>
      )}

      {!isLoading && !isError && candidates?.length > 0 && (
        <div className="hz-kanban-board">
          {STAGE_COLUMNS.map((stage) => (
            <div key={stage} className="hz-kanban-col">
              <div className="hz-kanban-col-header">
                <span className="hz-kanban-col-dot" style={{ background: STAGE_ACCENT[stage] }} />
                <span className="hz-kanban-col-title">{STAGE_LABEL[stage]}</span>
                <span className="hz-kanban-col-count">{columns[stage]?.length || 0}</span>
              </div>
              <div className="hz-kanban-col-body">
                {(columns[stage] || []).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCandidateId(c.id)}
                    className="hz-kanban-card"
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Avatar name={c.fullName} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <div className="text-truncate" style={{ fontWeight: 600, fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-primary)' }}>
                          {c.fullName}
                        </div>
                        <div className="text-truncate" style={{ fontSize: 11, color: 'var(--hz-text-muted)' }}>
                          {c.source || 'Direct'}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center justify-content-between" style={{ fontSize: 11, color: 'var(--hz-text-muted)' }}>
                      <span>{c.experienceYears != null ? `${c.experienceYears} yrs exp` : 'Exp. n/a'}</span>
                      <span>{new Date(c.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                ))}
                {(columns[stage] || []).length === 0 && <div className="hz-kanban-col-empty">No candidates</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddCandidate && <AddCandidateModal jobOpeningId={jobOpeningId} onClose={() => setShowAddCandidate(false)} />}
      {selectedCandidateId && <CandidateDetailModal candidateId={selectedCandidateId} onClose={() => setSelectedCandidateId(null)} />}
    </div>
  );
}

function AddCandidateModal({ jobOpeningId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', source: '', resumeUrl: '', experienceYears: '', skills: '' });
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

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <Dialog open onClose={onClose} title="Add Candidate" size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          create.mutate({
            ...form,
            jobOpeningId: Number(jobOpeningId),
            experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
          });
        }}
      >
        {error && (
          <div className="mb-3 px-3 py-2" style={{ background: 'var(--hz-danger-50)', color: 'var(--hz-danger-600)', borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="row g-3 mb-3">
          <FormField col={6} label="First Name" value={form.firstName} onChange={(v) => set('firstName', v)} required />
          <FormField col={6} label="Last Name" value={form.lastName} onChange={(v) => set('lastName', v)} required />
        </div>
        <FormField label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} required />
        <div className="row g-3 mb-3">
          <FormField col={6} label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          <FormField col={6} label="Source" placeholder="Referral, LinkedIn…" value={form.source} onChange={(v) => set('source', v)} />
        </div>
        <div className="row g-3 mb-3">
          <FormField col={6} label="Experience (yrs)" type="number" min="0" step="0.5" value={form.experienceYears} onChange={(v) => set('experienceYears', v)} />
          <FormField col={6} label="Skills" value={form.skills} onChange={(v) => set('skills', v)} />
        </div>
        <FormField label="Resume URL (optional)" value={form.resumeUrl} onChange={(v) => set('resumeUrl', v)} />

        <div className="d-flex justify-content-end gap-2 mt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending}>Add Candidate</Button>
        </div>
      </form>
    </Dialog>
  );
}
