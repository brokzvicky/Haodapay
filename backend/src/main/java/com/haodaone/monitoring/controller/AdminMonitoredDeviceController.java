package com.haodaone.monitoring.controller;

import com.haodaone.monitoring.dto.MonitoredDeviceDTO;
import com.haodaone.monitoring.service.DeviceEnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/devices")
public class AdminMonitoredDeviceController {

    private final DeviceEnrollmentService deviceEnrollmentService;

    public AdminMonitoredDeviceController(DeviceEnrollmentService deviceEnrollmentService) {
        this.deviceEnrollmentService = deviceEnrollmentService;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deviceEnrollmentService.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/rotate-token")
    @PreAuthorize("hasAuthority('MONITORING_MANAGE')")
    public Map<String, String> rotateToken(@PathVariable Long id) {
        MonitoredDeviceDTO.EnrollResponse response = deviceEnrollmentService.rotateToken(id);
        return Map.of(
                "deviceId", response.getDevice().getDeviceId(),
                "newToken", response.getRawToken());
    }
}