package com.haodaone.recruitment.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.org.repository.DepartmentRepository;
import com.haodaone.org.repository.DesignationRepository;
import com.haodaone.recruitment.dto.JobOpeningDTO;
import com.haodaone.recruitment.entity.JobOpening;
import com.haodaone.recruitment.repository.CandidateRepository;
import com.haodaone.recruitment.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class JobOpeningService {

    private static final Set<String> VALID_STATUSES = Set.of("OPEN", "ON_HOLD", "CLOSED");

    private final JobOpeningRepository jobOpeningRepository;
    private final CandidateRepository candidateRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final AuditLogService auditLogService;

    public JobOpeningService(JobOpeningRepository jobOpeningRepository, CandidateRepository candidateRepository,
                              DepartmentRepository departmentRepository, DesignationRepository designationRepository,
                              AuditLogService auditLogService) {
        this.jobOpeningRepository = jobOpeningRepository;
        this.candidateRepository = candidateRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * @Transactional(readOnly = true) is required: toEnrichedDTO() ->
     * JobOpeningDTO.from() calls department.getName() and
     * designation.getTitle(), both lazy relations. This job was only
     * "working" by coincidence whenever a listing's department/designation
     * happened to be null (see CandidateService.listAll()'s javadoc for the
     * full explanation - same root cause).
     */
    @Transactional(readOnly = true)
    public List<JobOpeningDTO> listAll() {
        return jobOpeningRepository.findAllByDeletedFalseOrderByPostedDateDesc().stream()
                .map(this::toEnrichedDTO)
                .toList();
    }

    @Transactional
    public JobOpeningDTO create(JobOpeningDTO.CreateRequest request) {
        JobOpening opening = new JobOpening();
        opening.setTitle(request.getTitle());
        opening.setEmploymentType(request.getEmploymentType() != null ? request.getEmploymentType() : "FULL_TIME");
        opening.setOpeningsCount(request.getOpeningsCount());
        opening.setDescription(request.getDescription());
        opening.setPostedDate(LocalDate.now());
        opening.setStatus("OPEN");

        if (request.getDepartmentId() != null) {
            opening.setDepartment(departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Unknown department: " + request.getDepartmentId())));
        }
        if (request.getDesignationId() != null) {
            opening.setDesignation(designationRepository.findById(request.getDesignationId())
                    .orElseThrow(() -> new BadRequestException("Unknown designation: " + request.getDesignationId())));
        }

        JobOpening saved = jobOpeningRepository.save(opening);
        auditLogService.log("JobOpening", saved.getId(), "CREATE", "Opened requisition '" + saved.getTitle() + "'");
        return toEnrichedDTO(saved);
    }

    @Transactional
    public JobOpeningDTO setStatus(Long id, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw new BadRequestException("Unknown status: " + status + ". Must be one of " + VALID_STATUSES);
        }
        JobOpening opening = jobOpeningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job opening not found: " + id));
        String old = opening.getStatus();
        opening.setStatus(status);
        if (status.equals("CLOSED")) {
            opening.setClosedDate(LocalDate.now());
        }
        JobOpening saved = jobOpeningRepository.save(opening);
        auditLogService.log("JobOpening", saved.getId(), "STATUS_CHANGE", "status: " + old + " -> " + status);
        return toEnrichedDTO(saved);
    }

    private JobOpeningDTO toEnrichedDTO(JobOpening opening) {
        JobOpeningDTO dto = JobOpeningDTO.from(opening);
        dto.setCandidateCount(candidateRepository.countByJobOpeningIdAndDeletedFalse(opening.getId()));
        dto.setHiredCount(candidateRepository.countByJobOpeningIdAndStageAndDeletedFalse(opening.getId(), "HIRED"));
        return dto;
    }
}
