import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { candidatesApi } from '../../api/endpoints/recruitment';
import Button from '../../components/ui/Button';

// Mirrors CandidateService.ALLOWED_ADVANCES on the backend - kept in sync
// manually since this is a small, stable state graph. The backend is the
// source of truth and re-validates regardless of what's offered here.
const ALLOWED_ADVANCES = {
  SHORTLISTED: [{ value: 'ROUND1', label: 'Move to Round 1 (HR Interview)' }, { value: 'HOLD', label: 'Put on Hold' }],
  HOLD: [
    { value: 'SHORTLISTED', label: 'Resume - Shortlisted' },
    { value: 'ROUND1', label: 'Resume - Round 1' },
    { value: 'ROUND2', label: 'Resume - Round 2' },
    { value: 'ROUND3', label: 'Resume - Round 3' },
  ],
  ROUND1: [{ value: 'HOLD', label: 'Put on Hold' }],
  ROUND2: [{ value: 'ROUND3', label: 'Advance to Round 3 (Final/Management)' }, { value: 'HOLD', label: 'Put on Hold' }],
  ROUND3: [{ value: 'HOLD', label: 'Put on Hold' }],
};

export default function AdvanceCandidateModal({ candidate, onClose }) {
  const queryClient = useQueryClient();
  const options = [...(ALLOWED_ADVANCES[candidate.stage] || []), { value: 'REJECTED', label: 'Reject' }];
  const [targetStage, setTargetStage] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState(null);

  const advance = useMutation({
    mutationFn: () => candidatesApi.advance(candidate.id, { targetStage, remarks: remarks || null, rejectionReason: rejectionReason || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not update this candidate.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!targetStage) {
      setError('Please choose what to do next.');
      return;
    }
    advance.mutate();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 440, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Update Pipeline Stage</h3>
            <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{candidate.fullName} · currently {candidate.stage}</div>
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

          <div className="mb-3 d-flex flex-column gap-2">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`btn text-start ${targetStage === o.value ? (o.value === 'REJECTED' ? 'btn-danger' : 'btn-primary') : 'btn-outline-secondary'}`}
                onClick={() => setTargetStage(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Remarks (optional)</label>
            <textarea className="form-control" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          {targetStage === 'REJECTED' && (
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Rejection Reason (optional)</label>
              <textarea className="form-control" rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={advance.isPending}>Confirm</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
