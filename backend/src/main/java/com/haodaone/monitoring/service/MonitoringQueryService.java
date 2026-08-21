package com.haodaone.monitoring.service;

import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.monitoring.dto.ActivitySessionDTO;
import com.haodaone.monitoring.repository.ActivitySessionRepository;
import com.haodaone.monitoring.repository.MonitoredDeviceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Read-side queries for the admin Monitoring dashboard - kept separate from
 * DeviceEnrollmentService (writes/lifecycle) and AgentIngestService (agent
 * ingestion), matching the audit module's split between AuditLogService
 * (writes) and AuditController reading straight from the repository for
 * simple paginated views.
 */
@Service
public class MonitoringQueryService {

    private final ActivitySessionRepository activitySessionRepository;
    private final MonitoredDeviceRepository deviceRepository;

    public MonitoringQueryService(ActivitySessionRepository activitySessionRepository,
                                   MonitoredDeviceRepository deviceRepository) {
        this.activitySessionRepository = activitySessionRepository;
        this.deviceRepository = deviceRepository;
    }

    public Page<ActivitySessionDTO> byDevice(Long deviceId, int page, int size) {
        if (!deviceRepository.existsById(deviceId)) {
            throw new ResourceNotFoundException("Monitored device not found: " + deviceId);
        }
        return activitySessionRepository.findByDevice_IdOrderByStartTimeDesc(deviceId, PageRequest.of(page, size))
                .map(ActivitySessionDTO::from);
    }

    public Page<ActivitySessionDTO> byEmployee(Long employeeId, int page, int size) {
        return activitySessionRepository.findByEmployee_IdOrderByStartTimeDesc(employeeId, PageRequest.of(page, size))
                .map(ActivitySessionDTO::from);
    }

    public Page<ActivitySessionDTO> byDateRange(LocalDateTime from, LocalDateTime to, int page, int size) {
        return activitySessionRepository.findByStartTimeBetweenOrderByStartTimeDesc(from, to, PageRequest.of(page, size))
                .map(ActivitySessionDTO::from);
    }
}
