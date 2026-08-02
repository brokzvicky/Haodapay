package com.haodaone.org.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.employee.entity.Employee;
import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.org.dto.DepartmentDTO;
import com.haodaone.org.entity.Department;
import com.haodaone.org.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    public DepartmentService(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository,
                              AuditLogService auditLogService) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.auditLogService = auditLogService;
    }

    public List<DepartmentDTO> listAll() {
        return departmentRepository.findAllByDeletedFalseOrderByNameAsc().stream()
                .map(this::toEnrichedDTO)
                .toList();
    }

    @Transactional
    public DepartmentDTO create(DepartmentDTO.CreateRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Department code '" + request.getCode() + "' is already in use");
        }

        Department department = new Department();
        department.setName(request.getName());
        department.setCode(request.getCode());
        department.setDescription(request.getDescription());
        department.setHeadEmployeeId(request.getHeadEmployeeId());
        if (request.getParentDepartmentId() != null) {
            department.setParentDepartment(departmentRepository.findById(request.getParentDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Unknown parent department: " + request.getParentDepartmentId())));
        }

        Department saved = departmentRepository.save(department);
        auditLogService.log("Department", saved.getId(), "CREATE", "Created department '" + saved.getName() + "'");
        return toEnrichedDTO(saved);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
        department.setActive(active);
        departmentRepository.save(department);
        auditLogService.log("Department", id, active ? "ACTIVATE" : "DEACTIVATE", "active: " + active);
    }

    private DepartmentDTO toEnrichedDTO(Department department) {
        DepartmentDTO dto = DepartmentDTO.from(department);
        dto.setEmployeeCount(employeeRepository.countByDepartmentIdAndDeletedFalse(department.getId()));
        if (department.getHeadEmployeeId() != null) {
            employeeRepository.findById(department.getHeadEmployeeId())
                    .map(Employee::getFullName)
                    .ifPresent(dto::setHeadEmployeeName);
        }
        return dto;
    }
}
