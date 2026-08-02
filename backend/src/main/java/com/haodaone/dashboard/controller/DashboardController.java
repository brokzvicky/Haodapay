package com.haodaone.dashboard.controller;

import com.haodaone.dashboard.dto.DashboardSummaryDTO;
import com.haodaone.employee.dto.EmployeeSummaryDTO;
import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.org.repository.DepartmentRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Powers the Dashboard "Command Center". Deliberately just aggregation
 * queries against existing repositories rather than a separate reporting
 * datastore - fine at Phase 1 scale; revisit with materialized views or a
 * read replica if/when this becomes a real bottleneck.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public DashboardController(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public DashboardSummaryDTO summary() {
        long total = employeeRepository.countByDeletedFalse();
        long active = employeeRepository.countByStatusAndDeletedFalse("ACTIVE");
        long onLeave = employeeRepository.countByStatusAndDeletedFalse("ON_LEAVE");
        long noticePeriod = employeeRepository.countByStatusAndDeletedFalse("NOTICE_PERIOD");
        long resigned = employeeRepository.countByStatusAndDeletedFalse("RESIGNED");
        long terminated = employeeRepository.countByStatusAndDeletedFalse("TERMINATED");

        List<DashboardSummaryDTO.DepartmentCount> departmentBreakdown = departmentRepository.findAllByDeletedFalseOrderByNameAsc().stream()
                .map(dept -> new DashboardSummaryDTO.DepartmentCount(
                        dept.getName(), employeeRepository.countByDepartmentIdAndDeletedFalse(dept.getId())))
                .filter(dc -> dc.getCount() > 0)
                .toList();

        List<EmployeeSummaryDTO> recentJoiners = employeeRepository.findTop5ByDeletedFalseOrderByDateOfJoiningDesc().stream()
                .map(EmployeeSummaryDTO::from)
                .toList();

        return new DashboardSummaryDTO(total, active, onLeave, noticePeriod, resigned, terminated, departmentBreakdown, recentJoiners);
    }
}
