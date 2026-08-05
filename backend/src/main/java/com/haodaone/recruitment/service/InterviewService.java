package com.haodaone.recruitment.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.employee.entity.Employee;
import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.recruitment.dto.InterviewDTO;
import com.haodaone.recruitment.entity.Candidate;
import com.haodaone.recruitment.entity.Interview;
import com.haodaone.recruitment.repository.CandidateRepository;
import com.haodaone.recruitment.repository.InterviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class InterviewService {

    /** Round number -> the candidate stage that round belongs to, and the human-readable round type label. */
    private static final Map<Integer, String> ROUND_STAGE = Map.of(1, "ROUND1", 2, "ROUND2", 3, "ROUND3");
    private static final Map<Integer, String> ROUND_TYPE = Map.of(1, "HR_INTERVIEW", 2, "HIRING_MANAGER", 3, "FINAL");

    private final InterviewRepository interviewRepository;
    private final CandidateRepository candidateRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    public InterviewService(InterviewRepository interviewRepository, CandidateRepository candidateRepository,
                             EmployeeRepository employeeRepository, AuditLogService auditLogService) {
        this.interviewRepository = interviewRepository;
        this.candidateRepository = candidateRepository;
        this.employeeRepository = employeeRepository;
        this.auditLogService = auditLogService;
    }

    public List<InterviewDTO> byCandidate(Long candidateId) {
        return interviewRepository.findAllByCandidateIdAndDeletedFalseOrderByScheduledAtDesc(candidateId).stream()
                .map(InterviewDTO::from)
                .toList();
    }

    public List<InterviewDTO> upcoming() {
        return interviewRepository.findAllByStatusOrderByScheduledAtAsc("SCHEDULED").stream()
                .map(InterviewDTO::from)
                .toList();
    }

    /**
     * Scheduling a round's interview requires the candidate to already be
     * in that round's stage (ROUND1/ROUND2/ROUND3) - i.e. HR must have
     * deliberately advanced them there first via CandidateService.advance.
     * This keeps "which round is the candidate in" and "log an interview
     * event for that round" as two separate, explicit HR actions rather
     * than inferring stage from whichever interview happens to get
     * scheduled.
     */
    @Transactional
    public InterviewDTO schedule(InterviewDTO.CreateRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new BadRequestException("Unknown candidate: " + request.getCandidateId()));

        String requiredStage = ROUND_STAGE.get(request.getRoundNumber());
        if (requiredStage == null) {
            throw new BadRequestException("Round must be 1, 2, or 3.");
        }
        if (!requiredStage.equals(candidate.getStage())) {
            throw new BadRequestException("Move the candidate to " + requiredStage
                    + " before scheduling a Round " + request.getRoundNumber() + " interview (currently " + candidate.getStage() + ").");
        }

        Interview interview = new Interview();
        interview.setCandidate(candidate);
        interview.setScheduledAt(request.getScheduledAt());
        interview.setRoundNumber(request.getRoundNumber());
        interview.setRoundType(ROUND_TYPE.get(request.getRoundNumber()));
        interview.setMode(request.getMode() != null ? request.getMode() : "VIDEO");
        interview.setStatus("SCHEDULED");

        if (request.getInterviewerId() != null) {
            Employee interviewer = employeeRepository.findById(request.getInterviewerId())
                    .orElseThrow(() -> new BadRequestException("Unknown interviewer: " + request.getInterviewerId()));
            interview.setInterviewer(interviewer);
        }

        Interview saved = interviewRepository.save(interview);
        auditLogService.log("Interview", saved.getId(), "CREATE",
                "Scheduled Round " + request.getRoundNumber() + " interview for '" + candidate.getFullName() + "' at " + request.getScheduledAt());
        return InterviewDTO.from(saved);
    }

    @Transactional
    public InterviewDTO submitFeedback(Long id, InterviewDTO.FeedbackRequest request) {
        Interview interview = interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found: " + id));

        interview.setRating(request.getRating());
        interview.setFeedback(request.getFeedback());
        interview.setStatus("COMPLETED");

        Interview saved = interviewRepository.save(interview);
        auditLogService.log("Interview", saved.getId(), "UPDATE",
                "Round " + interview.getRoundNumber() + " feedback submitted (rating " + request.getRating() + "/5)");
        return InterviewDTO.from(saved);
    }
}
