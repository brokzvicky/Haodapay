package com.haodaone.organization.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.organization.dto.CreateDepartmentRequest;
import com.haodaone.organization.dto.DepartmentDTO;
import com.haodaone.organization.entity.Department;
import com.haodaone.organization.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final AuditLogService auditLogService;

    public DepartmentService(DepartmentRepository departmentRepository, AuditLogService auditLogService) {
        this.departmentRepository = departmentRepository;
        this.auditLogService = auditLogService;
    }

    public List<DepartmentDTO> listAll() {
        return departmentRepository.findAllByDeletedFalseOrderByNameAsc().stream().map(DepartmentDTO::from).toList();
    }

    @Transactional
    public DepartmentDTO create(CreateDepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new BadRequestException("A department named '" + request.getName() + "' already exists");
        }
        if (departmentRepository.existsByCodeIgnoreCase(request.getCode())) {
            throw new BadRequestException("Department code '" + request.getCode() + "' is already in use");
        }

        Department department = new Department();
        department.setName(request.getName());
        department.setCode(request.getCode().toUpperCase());
        department.setDescription(request.getDescription());
        department.setHeadEmployeeId(request.getHeadEmployeeId());

        Department saved = departmentRepository.save(department);
        auditLogService.log("Department", saved.getId(), "CREATE", "Created department '" + saved.getName() + "'");
        return DepartmentDTO.from(saved);
    }

    @Transactional
    public DepartmentDTO update(Long id, CreateDepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));

        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setHeadEmployeeId(request.getHeadEmployeeId());

        Department saved = departmentRepository.save(department);
        auditLogService.log("Department", saved.getId(), "UPDATE", "Updated department '" + saved.getName() + "'");
        return DepartmentDTO.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        department.setDeleted(true);
        departmentRepository.save(department);
        auditLogService.log("Department", department.getId(), "DELETE", "Deleted department '" + department.getName() + "'");
    }
}
