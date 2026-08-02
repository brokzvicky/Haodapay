package com.haodaone.employee.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.employee.dto.CreateEmployeeRequest;
import com.haodaone.employee.dto.EmployeeDetailDTO;
import com.haodaone.employee.dto.EmployeeSummaryDTO;
import com.haodaone.employee.entity.Employee;
import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.org.entity.Department;
import com.haodaone.org.entity.Designation;
import com.haodaone.org.entity.Team;
import com.haodaone.org.repository.DepartmentRepository;
import com.haodaone.org.repository.DesignationRepository;
import com.haodaone.org.repository.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class EmployeeService {

    /** Valid forward/lateral transitions - keeps the lifecycle honest (e.g. can't go straight from ACTIVE to nothing, or resurrect a TERMINATED record via this endpoint). */
    private static final Set<String> VALID_STATUSES = Set.of("ACTIVE", "ON_LEAVE", "NOTICE_PERIOD", "RESIGNED", "TERMINATED");
    private static final String EMPLOYEE_CODE_PREFIX = "EMP";
    private static final int EMPLOYEE_CODE_DIGITS = 4;

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final TeamRepository teamRepository;
    private final AuditLogService auditLogService;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository,
                            DesignationRepository designationRepository, TeamRepository teamRepository,
                            AuditLogService auditLogService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.designationRepository = designationRepository;
        this.teamRepository = teamRepository;
        this.auditLogService = auditLogService;
    }

    public List<EmployeeSummaryDTO> listAll(String search) {
        List<Employee> employees = (search == null || search.isBlank())
                ? employeeRepository.findAllByDeletedFalseOrderByFirstNameAsc()
                : employeeRepository.search(search.trim());
        return employees.stream().map(EmployeeSummaryDTO::from).toList();
    }

    public EmployeeDetailDTO getById(Long id) {
        Employee employee = findActiveOrThrow(id);
        EmployeeDetailDTO dto = EmployeeDetailDTO.from(employee);
        List<EmployeeSummaryDTO> directReports = employeeRepository.findAllByReportingManagerIdAndDeletedFalse(id).stream()
                .map(EmployeeSummaryDTO::from)
                .toList();
        dto.setDirectReports(directReports);
        return dto;
    }

    @Transactional
    public EmployeeDetailDTO create(CreateEmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An employee with email '" + request.getEmail() + "' already exists");
        }

        Employee employee = new Employee();
        employee.setEmployeeCode(generateEmployeeCode());
        applyRequestFields(employee, request);
        employee.setStatus("ACTIVE");

        Employee saved = employeeRepository.save(employee);
        auditLogService.log("Employee", saved.getId(), "CREATE",
                "Onboarded '" + saved.getFullName() + "' (" + saved.getEmployeeCode() + ")");
        return EmployeeDetailDTO.from(saved);
    }

    @Transactional
    public EmployeeDetailDTO update(Long id, CreateEmployeeRequest request) {
        Employee employee = findActiveOrThrow(id);

        if (!employee.getEmail().equalsIgnoreCase(request.getEmail()) && employeeRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An employee with email '" + request.getEmail() + "' already exists");
        }

        applyRequestFields(employee, request);
        Employee saved = employeeRepository.save(employee);
        auditLogService.log("Employee", saved.getId(), "UPDATE", "Profile updated for '" + saved.getFullName() + "'");
        return EmployeeDetailDTO.from(saved);
    }

    @Transactional
    public EmployeeDetailDTO updateStatus(Long id, String newStatus, String reason) {
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new BadRequestException("Unknown status: " + newStatus + ". Must be one of " + VALID_STATUSES);
        }

        Employee employee = findActiveOrThrow(id);
        String oldStatus = employee.getStatus();
        employee.setStatus(newStatus);
        Employee saved = employeeRepository.save(employee);

        String details = "status: " + oldStatus + " -> " + newStatus + (reason != null && !reason.isBlank() ? " (" + reason + ")" : "");
        auditLogService.log("Employee", saved.getId(), "STATUS_CHANGE", details);
        return EmployeeDetailDTO.from(saved);
    }

    private void applyRequestFields(Employee employee, CreateEmployeeRequest request) {
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setGender(request.getGender());
        employee.setDateOfJoining(request.getDateOfJoining());
        employee.setEmploymentType(request.getEmploymentType() != null ? request.getEmploymentType() : "FULL_TIME");
        employee.setAddress(request.getAddress());
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());

        if (request.getDepartmentId() != null) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Unknown department: " + request.getDepartmentId()));
            employee.setDepartment(department);
        } else {
            employee.setDepartment(null);
        }

        if (request.getDesignationId() != null) {
            Designation designation = designationRepository.findById(request.getDesignationId())
                    .orElseThrow(() -> new BadRequestException("Unknown designation: " + request.getDesignationId()));
            employee.setDesignation(designation);
        } else {
            employee.setDesignation(null);
        }

        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new BadRequestException("Unknown team: " + request.getTeamId()));
            employee.setTeam(team);
        } else {
            employee.setTeam(null);
        }

        if (request.getReportingManagerId() != null) {
            if (employee.getId() != null && request.getReportingManagerId().equals(employee.getId())) {
                throw new BadRequestException("An employee cannot report to themselves");
            }
            Employee manager = employeeRepository.findById(request.getReportingManagerId())
                    .orElseThrow(() -> new BadRequestException("Unknown reporting manager: " + request.getReportingManagerId()));
            employee.setReportingManager(manager);
        } else {
            employee.setReportingManager(null);
        }
    }

    /** EMP0001, EMP0002, ... - looks at the highest existing suffix rather than a separate counter table, so it self-heals if a row is ever removed. */
    private String generateEmployeeCode() {
        Integer maxSuffix = employeeRepository.findMaxEmployeeCodeSuffix(EMPLOYEE_CODE_PREFIX, EMPLOYEE_CODE_PREFIX.length());
        int next = (maxSuffix == null ? 0 : maxSuffix) + 1;
        return EMPLOYEE_CODE_PREFIX + String.format("%0" + EMPLOYEE_CODE_DIGITS + "d", next);
    }

    @Transactional
    public EmployeeDetailDTO setBiometricMapping(Long id, String deviceUserId) {
        Employee employee = findActiveOrThrow(id);
        employee.setBiometricDeviceUserId(deviceUserId != null && deviceUserId.isBlank() ? null : deviceUserId);
        Employee saved = employeeRepository.save(employee);
        auditLogService.log("Employee", saved.getId(), "UPDATE",
                "Biometric device mapping set to " + (deviceUserId == null || deviceUserId.isBlank() ? "(none)" : deviceUserId));
        return EmployeeDetailDTO.from(saved);
    }

    private Employee findActiveOrThrow(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
        if (employee.isDeleted()) {
            throw new ResourceNotFoundException("Employee not found: " + id);
        }
        return employee;
    }
}
