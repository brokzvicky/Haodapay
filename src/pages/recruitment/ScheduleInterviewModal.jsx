import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { interviewsApi } from '../../api/endpoints/recruitment';
import { employeesApi } from '../../api/endpoints/employees';
import Button from '../../components/ui/Button';

const ROUND_BY_STAGE = { ROUND1: { number: 1, label: 'Round 1 - HR Interview' }, ROUND2: { number: 2, label: 'Round 2 - Hiring Manager Interview' }, ROUND3: { number: 3, label: 'Round 3 - Final / Management Interview' } };

export default function ScheduleInterviewModal({ candidate, onClose }) {
  const queryClient = useQueryClient();
  const round = ROUND_BY_STAGE[candidate.stage];
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [mode, setMode] = useState('VIDEO');
  const [error, setError] = useState(null);

  const schedule = useMutation({
    mutationFn: () =>
      interviewsApi.schedule({
        candidateId: candidate.id,
        roundNumber: round.number,
        scheduledAt,
        interviewerId: interviewerId || null,
        mode,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', candidate.id] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not schedule the interview.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    schedule.mutate();
  }

  if (!round) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 440, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Schedule Interview</h3>
            <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{candidate.fullName} · {round.label}</div>
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
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Date & Time *</label>
            <input type="datetime-local" className="form-control" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Interviewer</label>
            <select className="form-select" value={interviewerId} onChange={(e) => setInterviewerId(e.target.value)}>
              <option value="">Select interviewer</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Mode</label>
            <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="VIDEO">Video Call</option>
              <option value="PHONE">Phone Call</option>
              <option value="IN_PERSON">In Person</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={schedule.isPending}>Schedule</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
