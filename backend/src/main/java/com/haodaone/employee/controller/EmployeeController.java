package com.haodaone.employee.controller;

import com.haodaone.employee.dto.CreateEmployeeRequest;
import com.haodaone.employee.dto.EmployeeDetailDTO;
import com.haodaone.employee.dto.EmployeeSummaryDTO;
import com.haodaone.employee.dto.UpdateStatusRequest;
import com.haodaone.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public List<EmployeeSummaryDTO> listAll(@RequestParam(required = false) String search) {
        return employeeService.listAll(search);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW')")
    public EmployeeDetailDTO getById(@PathVariable Long id) {
        return employeeService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE')")
    public ResponseEntity<EmployeeDetailDTO> create(@Valid @RequestBody CreateEmployeeRequest request) {
        return ResponseEntity.status(201).body(employeeService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_MANAGE')")
    public EmployeeDetailDTO update(@PathVariable Long id, @Valid @RequestBody CreateEmployeeRequest request) {
        return employeeService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('EMPLOYEE_MANAGE')")
    public EmployeeDetailDTO updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return employeeService.updateStatus(id, request.getStatus(), request.getReason());
    }

    @PatchMapping("/{id}/biometric-mapping")
    @PreAuthorize("hasAuthority('EMPLOYEE_MANAGE')")
    public EmployeeDetailDTO setBiometricMapping(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return employeeService.setBiometricMapping(id, body.get("deviceUserId"));
    }
}
