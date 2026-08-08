package com.haodaone.leave.controller;

import com.haodaone.leave.dto.ApplyLeaveRequest;
import com.haodaone.leave.dto.LeaveBalanceDTO;
import com.haodaone.leave.dto.LeaveDecisionRequest;
import com.haodaone.leave.dto.LeaveRequestDTO;
import com.haodaone.leave.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    public LeaveRequestController(LeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('LEAVE_VIEW')")
    public List<LeaveRequestDTO> listAll(@RequestParam(required = false) String status) {
        return leaveRequestService.listAll(status);
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAuthority('LEAVE_VIEW') or hasAuthority('LEAVE_APPLY')")
    public List<LeaveRequestDTO> byEmployee(@PathVariable Long employeeId) {
        return leaveRequestService.listByEmployee(employeeId);
    }

    @GetMapping("/employee/{employeeId}/balance")
    @PreAuthorize("hasAuthority('LEAVE_VIEW') or hasAuthority('LEAVE_APPLY')")
    public List<LeaveBalanceDTO> balance(@PathVariable Long employeeId,
                                          @RequestParam(required = false) Integer year) {
        return leaveRequestService.getBalances(employeeId, year != null ? year : LocalDate.now().getYear());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('LEAVE_APPLY')")
    public ResponseEntity<LeaveRequestDTO> apply(@Valid @RequestBody ApplyLeaveRequest request) {
        return ResponseEntity.status(201).body(leaveRequestService.apply(request));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('LEAVE_APPROVE')")
    public LeaveRequestDTO approve(@PathVariable Long id, @RequestBody(required = false) LeaveDecisionRequest request) {
        return leaveRequestService.decide(id, true, request != null ? request.getNote() : null);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('LEAVE_APPROVE')")
    public LeaveRequestDTO reject(@PathVariable Long id, @RequestBody(required = false) LeaveDecisionRequest request) {
        return leaveRequestService.decide(id, false, request != null ? request.getNote() : null);
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('LEAVE_APPLY') or hasAuthority('LEAVE_APPROVE')")
    public LeaveRequestDTO cancel(@PathVariable Long id) {
        return leaveRequestService.cancel(id);
    }
}
