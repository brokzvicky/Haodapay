package com.haodaone.recruitment.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.recruitment.dto.CandidateDTO;
import com.haodaone.recruitment.entity.Candidate;
import com.haodaone.recruitment.entity.JobOpening;
import com.haodaone.recruitment.repository.CandidateRepository;
import com.haodaone.recruitment.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class CandidateService {

    /** APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED, with REJECTED reachable from any non-terminal stage. */
    private static final Set<String> VALID_STAGES = Set.of("APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED");

    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final AuditLogService auditLogService;

    public CandidateService(CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository,
                             AuditLogService auditLogService) {
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.auditLogService = auditLogService;
    }

    public List<CandidateDTO> listAll(Long jobOpeningId) {
        List<Candidate> candidates = jobOpeningId != null
                ? candidateRepository.findAllByJobOpeningIdAndDeletedFalseOrderByAppliedDateDesc(jobOpeningId)
                : candidateRepository.findAllByDeletedFalseOrderByAppliedDateDesc();
        return candidates.stream().map(CandidateDTO::from).toList();
    }

    @Transactional
    public CandidateDTO create(CandidateDTO.CreateRequest request) {
        JobOpening opening = jobOpeningRepository.findById(request.getJobOpeningId())
                .orElseThrow(() -> new BadRequestException("Unknown job opening: " + request.getJobOpeningId()));

        Candidate candidate = new Candidate();
        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setEmail(request.getEmail());
        candidate.setPhone(request.getPhone());
        candidate.setJobOpening(opening);
        candidate.setSource(request.getSource());
        candidate.setResumeUrl(request.getResumeUrl());
        candidate.setNotes(request.getNotes());
        candidate.setAppliedDate(LocalDate.now());
        candidate.setStage("APPLIED");

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "CREATE",
                "Added '" + saved.getFullName() + "' to the pipeline for '" + opening.getTitle() + "'");
        return CandidateDTO.from(saved);
    }

    @Transactional
    public CandidateDTO updateStage(Long id, CandidateDTO.StageUpdateRequest request) {
        if (!VALID_STAGES.contains(request.getStage())) {
            throw new BadRequestException("Unknown stage: " + request.getStage() + ". Must be one of " + VALID_STAGES);
        }
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));

        String oldStage = candidate.getStage();
        candidate.setStage(request.getStage());
        if (request.getOfferAmount() != null) {
            candidate.setOfferAmount(request.getOfferAmount());
        }
        if (request.getExpectedJoiningDate() != null) {
            candidate.setExpectedJoiningDate(request.getExpectedJoiningDate());
        }

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "STAGE_CHANGE",
                "stage: " + oldStage + " -> " + request.getStage() + " (" + saved.getFullName() + ")");
        return CandidateDTO.from(saved);
    }
}
