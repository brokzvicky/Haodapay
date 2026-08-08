package com.haodaone.org.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.org.dto.DesignationDTO;
import com.haodaone.org.entity.Department;
import com.haodaone.org.entity.Designation;
import com.haodaone.org.repository.DepartmentRepository;
import com.haodaone.org.repository.DesignationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DesignationService {

    private final DesignationRepository designationRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    public DesignationService(DesignationRepository designationRepository, DepartmentRepository departmentRepository,
                               AuditLogService auditLogService) {
        this.designationRepository = designationRepository;
        this.departmentRepository = departmentRepository;
        this.auditLogService = auditLogService;
    }

    public List<DesignationDTO> listAll() {
        return designationRepository.findAllByDeletedFalseOrderByTitleAsc().stream()
                .map(DesignationDTO::from)
                .toList();
    }

    @Transactional
    public DesignationDTO create(DesignationDTO.CreateRequest request) {
        Designation designation = new Designation();
        designation.setTitle(request.getTitle());
        designation.setLevel(request.getLevel());
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Unknown department: " + request.getDepartmentId()));
            designation.setDepartment(department);
        }

        Designation saved = designationRepository.save(designation);
        auditLogService.log("Designation", saved.getId(), "CREATE", "Created designation '" + saved.getTitle() + "'");
        return DesignationDTO.from(saved);
    }
}
