import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star } from 'lucide-react';
import { interviewsApi } from '../../api/endpoints/recruitment';
import Button from '../../components/ui/Button';

// Mirrors InterviewService.submitDecision's per-round decision vocabulary on the backend.
const DECISIONS_BY_ROUND = {
  2: [
    { value: 'SELECT_FOR_FINAL', label: 'Select for Final Round', variant: 'btn-primary' },
    { value: 'REJECTED', label: 'Reject', variant: 'btn-danger' },
  ],
  3: [
    { value: 'APPROVED_FOR_OFFER', label: 'Approve for Offer', variant: 'btn-primary' },
    { value: 'REJECTED', label: 'Reject', variant: 'btn-danger' },
  ],
};

function RatingInput({ label, value, onChange, required }) {
  return (
    <div className="mb-3">
      <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>
        {label} {required && '*'}
      </label>
      <div className="d-flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="btn btn-light border-0 p-1" onClick={() => onChange(n)}>
            <Star size={20} fill={n <= value ? 'var(--hz-warning-500, #f59e0b)' : 'none'} color={n <= value ? 'var(--hz-warning-500, #f59e0b)' : 'var(--hz-border)'} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InterviewDecisionModal({ interview, onClose }) {
  const queryClient = useQueryClient();
  const options = DECISIONS_BY_ROUND[interview.roundNumber] || [];

  const [technicalRating, setTechnicalRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState(null);

  const submit = useMutation({
    mutationFn: () =>
      interviewsApi.submitDecision(interview.id, {
        technicalRating: technicalRating || null,
        communicationRating: communicationRating || null,
        overallRating,
        remarks: remarks || null,
        decision,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['interviews', interview.candidateId] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not submit the decision.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!overallRating) {
      setError('Please give an overall rating.');
      return;
    }
    if (!decision) {
      setError('Please choose a decision.');
      return;
    }
    submit.mutate();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 460, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Interview Decision</h3>
            <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{interview.candidateName}</div>
          </div>
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

          <RatingInput label="Technical Rating" value={technicalRating} onChange={setTechnicalRating} />
          <RatingInput label="Communication Rating" value={communicationRating} onChange={setCommunicationRating} />
          <RatingInput label="Overall Rating" value={overallRating} onChange={setOverallRating} required />

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Remarks</label>
            <textarea className="form-control" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Decision *</label>
            <div className="d-flex flex-column gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`btn text-start ${decision === o.value ? o.variant : 'btn-outline-secondary'}`}
                  onClick={() => setDecision(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submit.isPending}>Submit Decision</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
