import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Send } from 'lucide-react';
import { candidatesApi } from '../../api/endpoints/recruitment';
import { employeesApi } from '../../api/endpoints/employees';
import Button from '../../components/ui/Button';

/**
 * "Select for Manager Round" from the HR interview decision. Distinct
 * from AdvanceCandidateModal's generic stage changes because this one
 * needs the hiring manager + schedule + Meet link the backend requires
 * to create the Round 2 interview and send both assignment emails - see
 * CandidateService.assignManagerRound.
 */
export default function AssignManagerModal({ candidate, onClose }) {
  const queryClient = useQueryClient();
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => employeesApi.list() });

  const [managerEmployeeId, setManagerEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState(null);

  const assign = useMutation({
    mutationFn: () =>
      candidatesApi.assignManager(candidate.id, {
        managerEmployeeId: Number(managerEmployeeId),
        scheduledAt: `${date}T${time}`,
        meetingLink,
        instructions: instructions || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', candidate.id] });
      queryClient.invalidateQueries({ queryKey: ['interviews', candidate.id] });
      onClose();
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not assign the manager round.'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!managerEmployeeId || !date || !time || !meetingLink.trim()) {
      setError('Hiring manager, date, time, and Google Meet link are all required.');
      return;
    }
    assign.mutate();
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div className="hz-surface" style={{ width: 480, padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 600, margin: 0 }}>Assign Manager Round</h3>
            <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>{candidate.fullName} · {candidate.jobOpeningTitle}</div>
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
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Hiring Manager *</label>
            <select className="form-select" value={managerEmployeeId} onChange={(e) => setManagerEmployeeId(e.target.value)} required>
              <option value="">Select hiring manager</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName}</option>
              ))}
            </select>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Interview Date *</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="col-6">
              <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Interview Time *</label>
              <input type="time" className="form-control" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Google Meet Link *</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 500 }}>Interview Instructions (optional)</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Shown to the hiring manager, not the candidate"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="mb-3 px-3 py-2 d-flex align-items-start gap-2" style={{ background: 'var(--hz-bg-subtle, #f7f8fa)', borderRadius: 8, fontSize: 12, color: 'var(--hz-text-secondary)' }}>
            <Send size={14} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>Assigning will email both the hiring manager and the candidate with these details automatically.</span>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={assign.isPending}>Assign</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
