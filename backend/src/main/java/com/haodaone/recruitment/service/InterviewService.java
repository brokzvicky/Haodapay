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

@Service
public class InterviewService {

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

    @Transactional
    public InterviewDTO schedule(InterviewDTO.CreateRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new BadRequestException("Unknown candidate: " + request.getCandidateId()));

        Interview interview = new Interview();
        interview.setCandidate(candidate);
        interview.setScheduledAt(request.getScheduledAt());
        interview.setMode(request.getMode() != null ? request.getMode() : "VIDEO");
        interview.setStatus("SCHEDULED");

        if (request.getInterviewerId() != null) {
            Employee interviewer = employeeRepository.findById(request.getInterviewerId())
                    .orElseThrow(() -> new BadRequestException("Unknown interviewer: " + request.getInterviewerId()));
            interview.setInterviewer(interviewer);
        }

        Interview saved = interviewRepository.save(interview);
        auditLogService.log("Interview", saved.getId(), "CREATE",
                "Scheduled interview for '" + candidate.getFullName() + "' at " + request.getScheduledAt());
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
                "Feedback submitted (rating " + request.getRating() + "/5)");
        return InterviewDTO.from(saved);
    }
}
