package com.haodaone.monitoring.service;

import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.monitoring.dto.ActivitySessionDTO;
import com.haodaone.monitoring.repository.ActivitySessionRepository;
import com.haodaone.monitoring.repository.MonitoredDeviceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class MonitoringQueryService {

    private final ActivitySessionRepository activitySessionRepository;
    private final MonitoredDeviceRepository deviceRepository;

    public MonitoringQueryService(
            ActivitySessionRepository activitySessionRepository,
            MonitoredDeviceRepository deviceRepository) {

        this.activitySessionRepository = activitySessionRepository;
        this.deviceRepository = deviceRepository;
    }

    /**
     * Get paginated activity sessions for a monitored device.
     */
    public Page<ActivitySessionDTO> byDevice(
            Long deviceId,
            int page,
            int size) {

        if (deviceId == null) {
            throw new IllegalArgumentException("Device ID must not be null");
        }

        if (!deviceRepository.existsById(deviceId)) {
            throw new ResourceNotFoundException(
                    "Monitored device not found: " + deviceId
            );
        }

        Pageable pageable = createPageable(page, size);

        return activitySessionRepository
                .findByDevice_IdOrderByStartTimeDesc(deviceId, pageable)
                .map(ActivitySessionDTO::from);
    }

    /**
     * Get paginated activity sessions for an employee.
     */
    public Page<ActivitySessionDTO> byEmployee(
            Long employeeId,
            int page,
            int size) {

        if (employeeId == null) {
            throw new IllegalArgumentException("Employee ID must not be null");
        }

        Pageable pageable = createPageable(page, size);

        return activitySessionRepository
                .findByEmployee_IdOrderByStartTimeDesc(employeeId, pageable)
                .map(ActivitySessionDTO::from);
    }

    /**
     * Get paginated activity sessions within a date/time range.
     */
    public Page<ActivitySessionDTO> byDateRange(
            LocalDateTime from,
            LocalDateTime to,
            int page,
            int size) {

        if (from == null) {
            throw new IllegalArgumentException("From date must not be null");
        }

        if (to == null) {
            throw new IllegalArgumentException("To date must not be null");
        }

        if (from.isAfter(to)) {
            throw new IllegalArgumentException(
                    "From date must not be after To date"
            );
        }

        Pageable pageable = createPageable(page, size);

        return activitySessionRepository
                .findByStartTimeBetweenOrderByStartTimeDesc(
                        from,
                        to,
                        pageable
                )
                .map(ActivitySessionDTO::from);
    }

    /**
     * Prevent invalid pagination parameters from reaching Spring Data.
     */
    private Pageable createPageable(int page, int size) {

        int safePage = Math.max(page, 0);

        int safeSize;
        if (size <= 0) {
            safeSize = 20;
        } else {
            safeSize = Math.min(size, 100);
        }

        return PageRequest.of(safePage, safeSize);
    }
}