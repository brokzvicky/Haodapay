import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Star } from 'lucide-react';
import { interviewsApi } from '../../api/endpoints/recruitment';
import Button from '../../components/ui/Button';

export default function InterviewFeedbackModal({ interview, candidateId, onClose }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(interview.rating || 0);
  const [feedback, setFeedback] = useState(interview.feedback || '');
  const [error, setError] = useState(null);

  const submit = useMutation({
    mutationFn: () => interviewsApi.submitFeedback(interview.id, { rating, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', candidateId] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not save feedback.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!rating) {
      setError('Please give a rating.');
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
      <div className="hz-surface" style={{ width: 440, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Interview Feedback</h3>
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
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Rating *</label>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" className="btn btn-light border-0 p-1" onClick={() => setRating(n)}>
                  <Star size={22} fill={n <= rating ? 'var(--hz-warning-500, #f59e0b)' : 'none'} color={n <= rating ? 'var(--hz-warning-500, #f59e0b)' : 'var(--hz-border)'} />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Feedback</label>
            <textarea className="form-control" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={submit.isPending}>Save Feedback</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
