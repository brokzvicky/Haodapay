import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Star, Download, CalendarClock, CheckCircle2 } from 'lucide-react';
import { candidatesApi, interviewsApi } from '../../api/endpoints/recruitment';
import { axiosClient } from '../../api/axiosClient';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ReviewCandidateModal from './ReviewCandidateModal';
import AdvanceCandidateModal from './AdvanceCandidateModal';
import AssignManagerModal from './AssignManagerModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import InterviewFeedbackModal from './InterviewFeedbackModal';
import GenerateOfferModal from './GenerateOfferModal';
import OfferLetterPanel from './OfferLetterPanel';

const STAGE_VARIANT = {
  APPLIED: 'neutral', SHORTLISTED: 'info', HOLD: 'warning',
  ROUND1: 'primary', ROUND2: 'primary', ROUND3: 'primary',
  OFFERED: 'warning', OFFER_LETTER_SENT: 'primary', HIRED: 'success', REJECTED: 'danger',
};
const ROUND_LABEL = { 1: 'Round 1 · HR Interview', 2: 'Round 2 · Hiring Manager', 3: 'Round 3 · Final / Management' };

export default function CandidateDetailModal({ candidateId, onClose }) {
  const queryClient = useQueryClient();
  const { data: candidate, isLoading } = useQuery({ queryKey: ['candidate', candidateId], queryFn: () => candidatesApi.get(candidateId) });
  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews', candidateId],
    queryFn: () => interviewsApi.byCandidate(candidateId),
    enabled: !!candidateId,
  });

  const [action, setAction] = useState(null); // 'review' | 'advance' | 'schedule' | 'offer'
  const [feedbackFor, setFeedbackFor] = useState(null);

  const acceptOffer = useMutation({
    mutationFn: () => candidatesApi.acceptOffer(candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] });
    },
  });

  if (isLoading || !candidate) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 50 }}>
        <div className="hz-surface p-4" style={{ width: 480 }}>Loading…</div>
      </div>
    );
  }

  const currentRoundInterview = interviews.find((i) => i.roundNumber === { ROUND1: 1, ROUND2: 2, ROUND3: 3 }[candidate.stage] && i.status === 'SCHEDULED');

  return (
    <>
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style={{ background: 'rgba(15, 23, 42, 0.45)', zIndex: 40, padding: 16 }}
        onClick={onClose}
      >
        <div className="hz-surface" style={{ width: 640, maxHeight: '88vh', overflowY: 'auto', padding: 0 }} onClick={(e) => e.stopPropagation()}>
          <div className="d-flex align-items-start justify-content-between p-4 pb-3" style={{ borderBottom: '1px solid var(--hz-border)' }}>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h3 style={{ fontSize: 'var(--hz-text-lg)', fontWeight: 700, margin: 0 }}>{candidate.fullName}</h3>
                <Badge variant={STAGE_VARIANT[candidate.stage] || 'neutral'}>{candidate.stage}</Badge>
              </div>
              <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-secondary)' }}>
                {candidate.email} · {candidate.phone} · {candidate.jobOpeningTitle}
              </div>
            </div>
            <button className="btn btn-light border-0 p-1" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="p-4 d-flex flex-column gap-4">
            {/* Application summary */}
            <div className="row g-3">
              <div className="col-6">
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>Experience</div>
                <div style={{ fontSize: 'var(--hz-text-sm)' }}>{candidate.experienceYears != null ? `${candidate.experienceYears} yrs` : '—'}</div>
              </div>
              <div className="col-6">
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>Source</div>
                <div style={{ fontSize: 'var(--hz-text-sm)' }}>{candidate.source || '—'}</div>
              </div>
              <div className="col-12">
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>Skills</div>
                <div style={{ fontSize: 'var(--hz-text-sm)' }}>{candidate.skills || '—'}</div>
              </div>
              <div className="col-12">
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase' }}>Resume</div>
                {candidate.hasResume ? (
                  <ResumeDownloadLink candidateId={candidate.id} filename={candidate.resumeOriginalName} />
                ) : candidate.resumeUrl ? (
                  <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--hz-text-sm)' }}>{candidate.resumeUrl}</a>
                ) : (
                  <span style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-text-muted)' }}>No resume on file</span>
                )}
              </div>
            </div>

            {/* Screening review */}
            {(candidate.rating || candidate.remarks || candidate.rejectionReason) && (
              <div className="p-3" style={{ background: 'var(--hz-bg-subtle, #f7f8fa)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>HR Screening Review</div>
                {candidate.rating && (
                  <div className="d-flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={14} fill={n <= candidate.rating ? 'var(--hz-warning-500, #f59e0b)' : 'none'} color={n <= candidate.rating ? 'var(--hz-warning-500, #f59e0b)' : 'var(--hz-border)'} />
                    ))}
                  </div>
                )}
                {candidate.remarks && <div style={{ fontSize: 'var(--hz-text-sm)' }}>{candidate.remarks}</div>}
                {candidate.rejectionReason && <div style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-danger-600)', marginTop: 4 }}>Rejection reason: {candidate.rejectionReason}</div>}
              </div>
            )}

            {/* Interview history */}
            {interviews.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Interview History</div>
                <div className="d-flex flex-column gap-2">
                  {interviews.map((iv) => (
                    <div key={iv.id} className="d-flex align-items-start justify-content-between p-2" style={{ border: '1px solid var(--hz-border)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 'var(--hz-text-sm)', fontWeight: 600 }}>{ROUND_LABEL[iv.roundNumber] || `Round ${iv.roundNumber}`}</div>
                        <div style={{ fontSize: 12, color: 'var(--hz-text-secondary)' }}>
                          {new Date(iv.scheduledAt).toLocaleString()} {iv.interviewerName ? `· ${iv.interviewerName}` : ''}
                        </div>
                        {iv.feedback && <div style={{ fontSize: 12, color: 'var(--hz-text-secondary)', marginTop: 4 }}>{iv.feedback}</div>}
                        {iv.meetingLink && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            <a href={iv.meetingLink} target="_blank" rel="noreferrer">{iv.meetingLink}</a>
                          </div>
                        )}
                        {iv.decision && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            <Badge variant={iv.decision === 'REJECTED' ? 'danger' : 'success'}>{iv.decision.replaceAll('_', ' ')}</Badge>
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <Badge variant={iv.status === 'COMPLETED' ? 'success' : 'neutral'}>{iv.status}</Badge>
                        {iv.rating && (
                          <div className="d-flex gap-1 justify-content-end mt-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} size={11} fill={n <= iv.rating ? 'var(--hz-warning-500, #f59e0b)' : 'none'} color={n <= iv.rating ? 'var(--hz-warning-500, #f59e0b)' : 'var(--hz-border)'} />
                            ))}
                          </div>
                        )}
                        {iv.status === 'SCHEDULED' && (
                          <div className="mt-1">
                            <Button size="sm" variant="secondary" onClick={() => setFeedbackFor(iv)}>Add Feedback</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offer summary */}
            {candidate.offerAmount != null && (
              <div className="p-3" style={{ background: 'var(--hz-bg-subtle, #f7f8fa)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--hz-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Offer</div>
                <div style={{ fontSize: 'var(--hz-text-sm)' }}>Amount: {candidate.offerAmount.toLocaleString()}</div>
                <div style={{ fontSize: 'var(--hz-text-sm)' }}>Joining: {candidate.expectedJoiningDate}</div>
                {candidate.offerAcceptedAt && (
                  <div className="d-flex align-items-center gap-1 mt-1" style={{ fontSize: 'var(--hz-text-sm)', color: 'var(--hz-success-600, #16a34a)' }}>
                    <CheckCircle2 size={14} /> Accepted - employee profile created
                  </div>
                )}
              </div>
            )}

            {/* Upload / send the offer letter document - shown once an offer has been generated */}
            {['OFFERED', 'OFFER_LETTER_SENT'].includes(candidate.stage) && (
              <OfferLetterPanel candidate={candidate} />
            )}

            {/* Contextual actions */}
            <div className="d-flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--hz-border)' }}>
              {candidate.stage === 'APPLIED' && <Button onClick={() => setAction('review')}>Review Application</Button>}

              {['SHORTLISTED', 'HOLD', 'ROUND1', 'ROUND2', 'ROUND3'].includes(candidate.stage) && (
                <Button variant="secondary" onClick={() => setAction('advance')}>
                  {candidate.stage === 'ROUND1' ? 'Reject / Hold' : 'Update Stage'}
                </Button>
              )}

              {candidate.stage === 'ROUND1' && (
                <Button onClick={() => setAction('assign-manager')}>Select for Manager Round</Button>
              )}

              {['ROUND1', 'ROUND2', 'ROUND3'].includes(candidate.stage) && !currentRoundInterview && (
                <Button variant="secondary" icon={CalendarClock} onClick={() => setAction('schedule')}>Schedule Interview</Button>
              )}

              {candidate.stage === 'ROUND3' && (
                <Button onClick={() => setAction('offer')}>Generate Offer</Button>
              )}

              {candidate.stage === 'OFFER_LETTER_SENT' && (
                <Button onClick={() => acceptOffer.mutate()} loading={acceptOffer.isPending}>Mark Offer Accepted &amp; Onboard</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {action === 'review' && <ReviewCandidateModal candidate={candidate} onClose={() => setAction(null)} />}
      {action === 'advance' && <AdvanceCandidateModal candidate={candidate} onClose={() => setAction(null)} />}
      {action === 'assign-manager' && <AssignManagerModal candidate={candidate} onClose={() => setAction(null)} />}
      {action === 'schedule' && <ScheduleInterviewModal candidate={candidate} onClose={() => setAction(null)} />}
      {action === 'offer' && <GenerateOfferModal candidate={candidate} onClose={() => setAction(null)} />}
      {feedbackFor && <InterviewFeedbackModal interview={feedbackFor} candidateId={candidateId} onClose={() => setFeedbackFor(null)} />}
    </>
  );
}

function ResumeDownloadLink({ candidateId, filename }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const response = await axiosClient.get(`/api/candidates/${candidateId}/resume`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'resume';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button className="btn btn-link p-0 d-inline-flex align-items-center gap-1" style={{ fontSize: 'var(--hz-text-sm)' }} onClick={handleDownload} disabled={downloading}>
      <Download size={14} /> {downloading ? 'Downloading…' : filename || 'Download resume'}
    </button>
  );
}
