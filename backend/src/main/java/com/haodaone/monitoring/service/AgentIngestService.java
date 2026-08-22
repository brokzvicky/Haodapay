package com.haodaone.monitoring.service;

import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.monitoring.dto.*;
import com.haodaone.monitoring.entity.ActivitySession;
import com.haodaone.monitoring.entity.MonitoredDevice;
import com.haodaone.monitoring.repository.ActivitySessionRepository;
import com.haodaone.monitoring.repository.MonitoredDeviceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Business logic behind POST /api/agent/heartbeat and POST
 * /api/agent/activity/batch. The caller (AgentController) has already been
 * authenticated by security.AgentTokenAuthenticationFilter, which resolves
 * the bearer token to a MonitoredDevice and passes it in here - this
 * service never re-validates the token itself, same separation
 * JwtAuthenticationFilter/CustomUserDetailsService already establish for
 * user auth.
 */
@Service
public class AgentIngestService {

    private static final Logger log = LoggerFactory.getLogger(AgentIngestService.class);

    private final MonitoredDeviceRepository deviceRepository;
    private final ActivitySessionRepository activitySessionRepository;
    private final EmployeeRepository employeeRepository;

    public AgentIngestService(MonitoredDeviceRepository deviceRepository,
                               ActivitySessionRepository activitySessionRepository,
                               EmployeeRepository employeeRepository) {
        this.deviceRepository = deviceRepository;
        this.activitySessionRepository = activitySessionRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public HeartbeatResponseData recordHeartbeat(MonitoredDevice authenticatedDevice, HeartbeatRequest request, String remoteIp) {
        MonitoredDevice device = syncDeviceIdentity(authenticatedDevice, request.getDevice(), remoteIp);

        device.setStatus(request.getStatus() != null ? request.getStatus() : "ONLINE");
        device.setCurrentApplication(request.getCurrentApplication());
        device.setCurrentWindowTitle(request.getCurrentWindowTitle());
        device.setLastSeenAt(request.getLastSeenUtc() != null
                ? request.getLastSeenUtc().atZoneSameInstant(ZoneOffset.UTC).toLocalDateTime()
                : LocalDateTime.now());
        if (request.getAgentVersion() != null) {
            device.setAgentVersion(request.getAgentVersion());
        }

        deviceRepository.save(device);

        HeartbeatResponseData.Directive directive = null;
        if (device.getHeartbeatIntervalSeconds() != null || device.isMonitoringPaused()) {
            directive = new HeartbeatResponseData.Directive(device.getHeartbeatIntervalSeconds(), device.isMonitoringPaused());
        }
        return HeartbeatResponseData.accepted(directive);
    }

    @Transactional
    public ActivityBatchResponseData recordActivityBatch(MonitoredDevice authenticatedDevice, ActivityBatchRequest request, String remoteIp) {
        MonitoredDevice device = syncDeviceIdentity(authenticatedDevice, request.getDevice(), remoteIp);

        List<String> accepted = new ArrayList<>();
        for (ActivitySessionPayload payload : request.getSessions()) {
            if (activitySessionRepository.existsBySessionId(payload.getSessionId())) {
                // Already persisted from a previous delivery attempt - still report it accepted
                // so the agent's LocalCacheService prunes it, matching ApiClientService's contract.
                accepted.add(payload.getSessionId());
                continue;
            }

            ActivitySession session = new ActivitySession();
            session.setSessionId(payload.getSessionId());
            session.setDevice(device);
            session.setProcessName(payload.getProcessName());
            session.setApplicationName(payload.getApplicationName());
            session.setWindowTitle(payload.getWindowTitle());
            session.setStartTime(toLocalDateTime(payload.getStartTimeUtc()));
            session.setEndTime(toLocalDateTime(payload.getEndTimeUtc()));
            session.setDurationSeconds(payload.getDurationSeconds());
            session.setIdleSession(payload.isIdleSession());

            // Prefer the device's already-resolved employee (resolved via
            // Employee ID in syncDeviceIdentity above); only fall back to a
            // per-session username lookup if the device itself has no
            // resolved employee yet.
            if (device.getEmployee() != null) {
                session.setEmployee(device.getEmployee());
            } else {
                String username = payload.getUsername() != null ? payload.getUsername() : request.getDevice().getUsername();
                resolveEmployee(username).ifPresent(session::setEmployee);
            }

            activitySessionRepository.save(session);
            accepted.add(payload.getSessionId());
        }

        log.debug("Accepted {}/{} activity sessions for device {}", accepted.size(), request.getSessions().size(), device.getDeviceId());
        return ActivityBatchResponseData.of(accepted);
    }

    /**
     * Fills in the agent-generated deviceId on first check-in (enrollment
     * only knows the admin-chosen name, not the hardware id - see
     * DeviceEnrollmentService#enroll) and refreshes identifying fields on
     * every call after that. Guards against a deviceId collision with a
     * different already-identified device, which would indicate a token
     * reused across two machines.
     */
    private MonitoredDevice syncDeviceIdentity(MonitoredDevice device, DeviceInfoPayload payload, String remoteIp) {
        if (payload != null && payload.getDeviceId() != null && !payload.getDeviceId().isBlank()) {
            if (device.getDeviceId().startsWith("PENDING-")) {
                device.setDeviceId(payload.getDeviceId());
            } else if (!device.getDeviceId().equals(payload.getDeviceId())) {
                log.warn("Device {} reported deviceId {} which does not match enrolled deviceId {} - keeping enrolled value",
                        device.getId(), payload.getDeviceId(), device.getDeviceId());
            }
            if (payload.getDeviceName() != null && !payload.getDeviceName().isBlank()) {
                device.setDeviceName(payload.getDeviceName());
            }
            device.setWindowsUsername(payload.getUsername());
            device.setDomainName(payload.getDomainName());
            device.setOperatingSystem(payload.getOperatingSystem());
            device.setOsVersion(payload.getOsVersion());
            device.setMacAddress(payload.getMacAddress());
            if (payload.getHostname() != null && !payload.getHostname().isBlank()) {
                device.setHostname(payload.getHostname());
            }
            if (payload.getMachineGuid() != null && !payload.getMachineGuid().isBlank()) {
                device.setMachineGuid(payload.getMachineGuid());
            }
            if (payload.getAgentVersion() != null) {
                device.setAgentVersion(payload.getAgentVersion());
            }
            device.setIpAddress(payload.getIpAddress());

            // Employee ID (employeeCode) is authoritative when the agent sends
            // one - re-resolved on every call so a re-assignment (device
            // handed to a different employee, config re-provisioned) takes
            // effect on the device's next check-in without an admin having to
            // touch the record here. windowsUsername is only a fallback for
            // agents that predate employeeId being configured.
            java.util.Optional<com.haodaone.employee.entity.Employee> resolved = resolveEmployee(payload.getEmployeeId(), payload.getUsername());
            if (resolved.isPresent()) {
                device.setEmployee(resolved.get());
            } else if (device.getEmployee() == null) {
                log.debug("Could not resolve employee for device {} (employeeId={}, username={})",
                        device.getDeviceId(), payload.getEmployeeId(), payload.getUsername());
            }
        }
        device.setLastIpAddress(remoteIp);
        return device;
    }

    /** Employee ID (employeeCode) first, windowsUsername as a fallback - see DeviceInfoPayload.employeeId javadoc. */
    private java.util.Optional<com.haodaone.employee.entity.Employee> resolveEmployee(String employeeCode, String windowsUsername) {
        if (employeeCode != null && !employeeCode.isBlank()) {
            java.util.Optional<com.haodaone.employee.entity.Employee> byCode = employeeRepository.findByEmployeeCodeAndDeletedFalse(employeeCode.trim());
            if (byCode.isPresent()) {
                return byCode;
            }
            log.warn("Agent reported employeeId '{}' which does not match any active employee - falling back to windowsUsername", employeeCode);
        }
        return resolveEmployee(windowsUsername);
    }

    private java.util.Optional<com.haodaone.employee.entity.Employee> resolveEmployee(String windowsUsername) {
        if (windowsUsername == null || windowsUsername.isBlank()) {
            return java.util.Optional.empty();
        }
        return employeeRepository.findByUser_UsernameAndDeletedFalse(windowsUsername);
    }

    private LocalDateTime toLocalDateTime(java.time.OffsetDateTime offsetDateTime) {
        return offsetDateTime != null ? offsetDateTime.atZoneSameInstant(ZoneOffset.UTC).toLocalDateTime() : null;
    }
}
