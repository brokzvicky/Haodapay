import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star } from 'lucide-react';
import { candidatesApi } from '../../api/endpoints/recruitment';
import Button from '../../components/ui/Button';

const DECISIONS = [
  { value: 'SHORTLISTED', label: 'Shortlist', variant: 'success' },
  { value: 'HOLD', label: 'Hold', variant: 'warning' },
  { value: 'REJECTED', label: 'Reject', variant: 'danger' },
];

export default function ReviewCandidateModal({ candidate, onClose }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState(null);
  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState(null);

  const review = useMutation({
    mutationFn: () => candidatesApi.review(candidate.id, { decision, rating: rating || null, remarks: remarks || null, rejectionReason: rejectionReason || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not save the review.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!decision) {
      setError('Please choose Shortlist, Hold, or Reject.');
      return;
    }
    review.mutate();
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
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Review Application</h3>
            <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{candidate.fullName}</div>
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

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Decision</label>
            <div className="d-flex gap-2">
              {DECISIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`btn ${decision === d.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setDecision(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Rating (optional)</label>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className="btn btn-light border-0 p-1" onClick={() => setRating(n === rating ? 0 : n)}>
                  <Star size={22} fill={n <= rating ? 'var(--hz-warning-500, #f59e0b)' : 'none'} color={n <= rating ? 'var(--hz-warning-500, #f59e0b)' : 'var(--hz-border)'} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Remarks (optional)</label>
            <textarea className="form-control" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Screening notes for the pipeline history…" />
          </div>

          {decision === 'REJECTED' && (
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Rejection Reason (optional)</label>
              <textarea className="form-control" rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={review.isPending}>Save Review</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
