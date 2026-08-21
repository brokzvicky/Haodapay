package com.haodaone.monitoring.controller;

import com.haodaone.monitoring.dto.MonitoredDeviceDTO;
import com.haodaone.monitoring.service.DeviceEnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-facing device lifecycle - list, enroll (mint a token before the
 * agent is installed on a machine), pause/resume, activate/deactivate,
 * rotate token. Mirrors org.controller.DepartmentController's shape.
 */
@RestController
@RequestMapping("/api/monitoring/devices")
public class MonitoredDeviceController {

    private final DeviceEnrollmentService deviceEnrollmentService;

    public MonitoredDeviceController(DeviceEnrollmentService deviceEnrollmentService) {
        this.deviceEnrollmentService = deviceEnrollmentService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MONITORING_VIEW')")
    public List<MonitoredDeviceDTO> listAll() {
        return deviceEnrollmentService.listAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MONITORING_VIEW')")
    public MonitoredDeviceDTO get(@PathVariable Long id) {
        return deviceEnrollmentService.get(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public ResponseEntity<MonitoredDeviceDTO.EnrollResponse> enroll(@Valid @RequestBody MonitoredDeviceDTO.EnrollRequest request) {
        return ResponseEntity.status(201).body(deviceEnrollmentService.enroll(request));
    }

    @PostMapping("/{id}/rotate-token")
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public MonitoredDeviceDTO.EnrollResponse rotateToken(@PathVariable Long id) {
        return deviceEnrollmentService.rotateToken(id);
    }

    @PatchMapping("/{id}/directive")
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public MonitoredDeviceDTO applyDirective(@PathVariable Long id, @RequestBody MonitoredDeviceDTO.DirectiveRequest request) {
        return deviceEnrollmentService.applyDirective(id, request);
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public ResponseEntity<Void> activate(@PathVariable Long id) {
        deviceEnrollmentService.setActive(id, true);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        deviceEnrollmentService.setActive(id, false);
        return ResponseEntity.noContent().build();
    }
}
