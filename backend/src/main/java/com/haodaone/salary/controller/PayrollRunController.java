package com.haodaone.salary.controller;

import com.haodaone.salary.dto.*;
import com.haodaone.salary.service.PayrollService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Payroll Processing: run lifecycle (DRAFT -> PROCESSED -> PAID) and per-employee hold toggling. See SalaryStructureController for this module's authorization note. */
@RestController
@RequestMapping("/api/salary/payroll-runs")
@PreAuthorize("isAuthenticated()")
public class PayrollRunController {

    private final PayrollService payrollService;

    public PayrollRunController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping
    public List<PayrollRunSummaryDTO> listRuns() {
        return payrollService.listRuns();
    }

    @GetMapping("/{runId}")
    public PayrollRunDTO getRun(@PathVariable Long runId) {
        return payrollService.getRun(runId);
    }

    @PostMapping
    public ResponseEntity<PayrollRunDTO> createRun(@Valid @RequestBody CreatePayrollRunRequest request) {
        return ResponseEntity.status(201).body(payrollService.createRun(request));
    }

    @PatchMapping("/{runId}/items/{itemId}/hold")
    public PayrollItemDTO setItemHold(@PathVariable Long runId, @PathVariable Long itemId,
                                       @RequestBody UpdatePayrollItemRequest request) {
        return payrollService.setItemHold(runId, itemId, request);
    }

    @PostMapping("/{runId}/process")
    public PayrollRunDTO process(@PathVariable Long runId) {
        return payrollService.process(runId);
    }

    @PostMapping("/{runId}/mark-paid")
    public PayrollRunDTO markPaid(@PathVariable Long runId, @RequestBody(required = false) MarkPaidRequest request) {
        return payrollService.markPaid(runId, request != null ? request : new MarkPaidRequest());
    }

    @DeleteMapping("/{runId}")
    public ResponseEntity<Void> cancel(@PathVariable Long runId) {
        payrollService.cancel(runId);
        return ResponseEntity.noContent().build();
    }
}
