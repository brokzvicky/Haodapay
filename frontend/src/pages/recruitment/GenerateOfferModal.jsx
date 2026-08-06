import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send } from 'lucide-react';
import { candidatesApi } from '../../api/endpoints/recruitment';
import Button from '../../components/ui/Button';

export default function GenerateOfferModal({ candidate, onClose }) {
  const queryClient = useQueryClient();
  const [offerAmount, setOfferAmount] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState('');
  const [error, setError] = useState(null);

  const generate = useMutation({
    mutationFn: () => candidatesApi.generateOffer(candidate.id, { offerAmount: Number(offerAmount), expectedJoiningDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not generate the offer.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    generate.mutate();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 420, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Generate Offer</h3>
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
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Offer Amount (Annual CTC) *</label>
            <input type="number" min="0" step="1000" className="form-control" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Expected Joining Date *</label>
            <input type="date" className="form-control" value={expectedJoiningDate} onChange={(e) => setExpectedJoiningDate(e.target.value)} required />
          </div>

          <div className="mb-3 px-3 py-2 d-flex align-items-start gap-2" style={{ background: 'var(--hz-bg-subtle, #f7f8fa)', borderRadius: 8, fontSize: 12, color: 'var(--hz-text-secondary)' }}>
            <Send size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>Generating the offer emails it to the candidate automatically.</span>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={generate.isPending}>Generate Offer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
