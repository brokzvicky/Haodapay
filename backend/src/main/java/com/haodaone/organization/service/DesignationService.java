package com.haodaone.organization.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.organization.dto.CreateDesignationRequest;
import com.haodaone.organization.dto.DesignationDTO;
import com.haodaone.organization.entity.Designation;
import com.haodaone.organization.repository.DesignationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DesignationService {

    private final DesignationRepository designationRepository;
    private final AuditLogService auditLogService;

    public DesignationService(DesignationRepository designationRepository, AuditLogService auditLogService) {
        this.designationRepository = designationRepository;
        this.auditLogService = auditLogService;
    }

    public List<DesignationDTO> listAll() {
        return designationRepository.findAllByDeletedFalseOrderByTitleAsc().stream().map(DesignationDTO::from).toList();
    }

    @Transactional
    public DesignationDTO create(CreateDesignationRequest request) {
        if (designationRepository.existsByTitleIgnoreCase(request.getTitle())) {
            throw new BadRequestException("Designation '" + request.getTitle() + "' already exists");
        }

        Designation designation = new Designation();
        designation.setTitle(request.getTitle());
        designation.setLevel(request.getLevel());
        designation.setDepartmentId(request.getDepartmentId());

        Designation saved = designationRepository.save(designation);
        auditLogService.log("Designation", saved.getId(), "CREATE", "Created designation '" + saved.getTitle() + "'");
        return DesignationDTO.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Designation designation = designationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found: " + id));
        designation.setDeleted(true);
        designationRepository.save(designation);
        auditLogService.log("Designation", designation.getId(), "DELETE", "Deleted designation '" + designation.getTitle() + "'");
    }
}
