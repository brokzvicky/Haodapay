package com.haodaone.monitoring.repository;

import com.haodaone.monitoring.entity.ActivitySession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface ActivitySessionRepository extends JpaRepository<ActivitySession, Long> {

    /** De-duplication check for batch ingestion - see AgentIngestService#recordActivityBatch. */
    boolean existsBySessionId(String sessionId);

    Page<ActivitySession> findByDevice_IdOrderByStartTimeDesc(Long deviceId, Pageable pageable);

    Page<ActivitySession> findByEmployee_IdOrderByStartTimeDesc(Long employeeId, Pageable pageable);

    Page<ActivitySession> findByStartTimeBetweenOrderByStartTimeDesc(LocalDateTime from, LocalDateTime to, Pageable pageable);

    long countByDevice_IdAndIdleSessionFalseAndStartTimeAfter(Long deviceId, LocalDateTime after);
}
