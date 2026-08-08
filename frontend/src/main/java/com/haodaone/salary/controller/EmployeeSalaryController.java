package com.haodaone.salary.controller;

import com.haodaone.salary.dto.EmployeeSalaryDetailDTO;
import com.haodaone.salary.dto.EmployeeSalarySummaryDTO;
import com.haodaone.salary.service.EmployeeSalaryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Employee Salary List + Salary Details. */
@RestController
@RequestMapping("/api/salary/employees")
@PreAuthorize("hasAuthority('SALARY_VIEW')")
public class EmployeeSalaryController {

    private final EmployeeSalaryService employeeSalaryService;

    public EmployeeSalaryController(EmployeeSalaryService employeeSalaryService) {
        this.employeeSalaryService = employeeSalaryService;
    }

    @GetMapping
    public Page<EmployeeSalarySummaryDTO> list(@RequestParam(required = false) String search,
                                                @RequestParam(required = false) Long departmentId,
                                                @RequestParam(required = false) String status,
                                                @RequestParam(required = false, defaultValue = "employeeName") String sortBy,
                                                @RequestParam(required = false, defaultValue = "asc") String sortDir,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return employeeSalaryService.list(search, departmentId, status, sortBy, sortDir, PageRequest.of(page, size));
    }

    @GetMapping("/{employeeId}")
    public EmployeeSalaryDetailDTO getDetail(@PathVariable Long employeeId) {
        return employeeSalaryService.getDetail(employeeId);
    }
}
