package com.haodaone.recruitment.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.org.repository.DepartmentRepository;
import com.haodaone.org.repository.DesignationRepository;
import com.haodaone.recruitment.dto.JobOpeningDTO;
import com.haodaone.recruitment.dto.CloseRequisitionRequest;
import com.haodaone.recruitment.entity.JobOpening;
import com.haodaone.recruitment.repository.CandidateRepository;
import com.haodaone.recruitment.repository.JobOpeningRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.time.LocalDateTime;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class JobOpeningService {

    private static final Set<String> VALID_STATUSES = Set.of("OPEN", "ON_HOLD", "CLOSED");
    private static final Set<String> VALID_CLOSE_REASONS = Set.of("POSITION_FILLED", "HIRING_CANCELLED", "BUDGET_ON_HOLD", "DUPLICATE_REQUISITION", "OTHER");

    private final JobOpeningRepository jobOpeningRepository;
    private final CandidateRepository candidateRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    public JobOpeningService(JobOpeningRepository jobOpeningRepository, CandidateRepository candidateRepository,
                              DepartmentRepository departmentRepository, DesignationRepository designationRepository,
                              EmployeeRepository employeeRepository, AuditLogService auditLogService) {
        this.jobOpeningRepository = jobOpeningRepository;
        this.candidateRepository = candidateRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.employeeRepository = employeeRepository;
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
        if (request.getRecruiterId() != null) {
            opening.setRecruiter(employeeRepository.findById(request.getRecruiterId())
                    .orElseThrow(() -> new BadRequestException("Unknown employee: " + request.getRecruiterId())));
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
        if ("CLOSED".equals(status)) {
            throw new BadRequestException("Use the close requisition action with a reason");
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

    @Transactional
    public JobOpeningDTO close(Long id, CloseRequisitionRequest request) {
        JobOpening opening = jobOpeningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job opening not found: " + id));
        if (!"OPEN".equals(opening.getStatus())) {
            throw new BadRequestException("Only OPEN requisitions can be closed");
        }
        String reason = request.getReason().trim();
        if (reason.isEmpty()) throw new BadRequestException("Close reason is required");
        if (!VALID_CLOSE_REASONS.contains(reason)) {
            throw new BadRequestException("Invalid close reason");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null && auth.isAuthenticated() ? auth.getName() : "system";
        LocalDateTime now = LocalDateTime.now();
        opening.setStatus("CLOSED");
        opening.setClosedDate(now.toLocalDate());
        opening.setClosedReason(reason);
        opening.setClosedComments(request.getComments() == null || request.getComments().isBlank() ? null : request.getComments().trim());
        opening.setClosedBy(username);
        opening.setClosedAt(now);
        JobOpening saved = jobOpeningRepository.save(opening);
        auditLogService.log("JobOpening", saved.getId(), "CLOSED", "Closed requisition '" + saved.getTitle() + "' (reason: " + reason + ")");
        return toEnrichedDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        JobOpening opening = jobOpeningRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job opening not found: " + id));
        long candidateCount = candidateRepository.countByJobOpeningIdAndDeletedFalse(id);
        if (candidateCount > 0) {
            throw new BadRequestException("Cannot delete a job opening with candidates. Close it instead.");
        }
        opening.setDeleted(true);
        opening.setDeletedAt(java.time.LocalDateTime.now());
        jobOpeningRepository.save(opening);
        auditLogService.log("JobOpening", id, "DELETE", "Deleted requisition '" + opening.getTitle() + "'");
    }

    private JobOpeningDTO toEnrichedDTO(JobOpening opening) {
        JobOpeningDTO dto = JobOpeningDTO.from(opening);
        dto.setCandidateCount(candidateRepository.countByJobOpeningIdAndDeletedFalse(opening.getId()));
        dto.setHiredCount(candidateRepository.countByJobOpeningIdAndStageAndDeletedFalse(opening.getId(), "HIRED"));
        return dto;
    }
}
