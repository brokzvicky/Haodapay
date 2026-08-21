package com.haodaone.monitoring.repository;

import com.haodaone.monitoring.entity.MonitoredDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonitoredDeviceRepository extends JpaRepository<MonitoredDevice, Long> {

    List<MonitoredDevice> findAllByDeletedFalseOrderByDeviceNameAsc();

    Optional<MonitoredDevice> findByDeviceIdAndDeletedFalse(String deviceId);

    /** Used by the agent-token authentication filter - looked up by hash, never by raw token (see security.AgentTokenAuthenticationFilter). */
    Optional<MonitoredDevice> findByAgentTokenHashAndDeletedFalse(String agentTokenHash);

    boolean existsByAgentTokenHash(String agentTokenHash);
}
