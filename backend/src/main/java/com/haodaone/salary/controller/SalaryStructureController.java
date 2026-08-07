package com.haodaone.salary.controller;

import com.haodaone.salary.dto.SalaryStructureDTO;
import com.haodaone.salary.dto.UpsertSalaryStructureRequest;
import com.haodaone.salary.service.SalaryStructureService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Salary structure definition/revision.
 *
 * Authorization: gated to any authenticated user for this phase - Salary
 * module permission codes (e.g. SALARY_VIEW / SALARY_MANAGE) land in a
 * later phase alongside the rest of this module's RBAC wiring, per the
 * phased build plan. Do not copy this pattern into other modules.
 */
@RestController
@RequestMapping("/api/salary/structures")
@PreAuthorize("isAuthenticated()")
public class SalaryStructureController {

    private final SalaryStructureService salaryStructureService;

    public SalaryStructureController(SalaryStructureService salaryStructureService) {
        this.salaryStructureService = salaryStructureService;
    }

    @GetMapping("/employee/{employeeId}/current")
    public SalaryStructureDTO getCurrent(@PathVariable Long employeeId) {
        return salaryStructureService.getCurrent(employeeId);
    }

    @GetMapping("/employee/{employeeId}")
    public List<SalaryStructureDTO> getHistory(@PathVariable Long employeeId) {
        return salaryStructureService.getHistory(employeeId);
    }

    @PostMapping
    public ResponseEntity<SalaryStructureDTO> upsert(@Valid @RequestBody UpsertSalaryStructureRequest request) {
        return ResponseEntity.status(201).body(salaryStructureService.upsert(request));
    }
}
