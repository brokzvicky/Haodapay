package com.haodaone.monitoring.repository;

import com.haodaone.monitoring.entity.ActivitySession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivitySessionRepository extends JpaRepository<ActivitySession, Long> {

    /** De-duplication check for batch ingestion - see AgentIngestService#recordActivityBatch. */
    boolean existsBySessionId(String sessionId);

    Page<ActivitySession> findByDevice_IdOrderByStartTimeDesc(Long deviceId, Pageable pageable);

    Page<ActivitySession> findByEmployee_IdOrderByStartTimeDesc(Long employeeId, Pageable pageable);

    Page<ActivitySession> findByStartTimeBetweenOrderByStartTimeDesc(LocalDateTime from, LocalDateTime to, Pageable pageable);

    long countByDevice_IdAndIdleSessionFalseAndStartTimeAfter(Long deviceId, LocalDateTime after);

    /**
     * Backs every report/productivity/export endpoint in
     * monitoring.report.* - every filter is optional except the date
     * range, which is always supplied (bounded so a report can't
     * accidentally scan the whole table). Employee/department filters
     * tolerate a null employee on the session (unassigned devices) by
     * simply excluding those rows once any employee-scoped filter is set,
     * same as an inner join would.
     *
     * IMPORTANT - do not wrap :employeeNamePattern / :deviceNamePattern in
     * concat()/lower() here. See ProductivityReportService#fetchSessions
     * for why: those two parameters must arrive pre-built ("%value%",
     * already lower-cased) and be compared directly via `ilike` against a
     * mapped String expression, or Hibernate 6 cannot infer a JDBC type for
     * them and silently binds them as bytea, which blows up every report
     * endpoint with "function lower(bytea) does not exist" /
     * "operator does not exist: text ~~ bytea".
     */
    @Query("""
select s
from ActivitySession s
join s.device d
left join s.employee e
where s.startTime >= :from
and s.startTime < :to
and (:employeeId is null or e.id = :employeeId)
and (:employeeCode is null or e.employeeCode = :employeeCode)
and (:employeeNamePattern is null or concat(e.firstName, ' ', e.lastName) ilike :employeeNamePattern)
and (:departmentId is null or e.department.id = :departmentId)
and (:deviceId is null or d.id = :deviceId)
and (:deviceNamePattern is null or d.deviceName ilike :deviceNamePattern)
order by s.startTime asc
""")
    List<ActivitySession> search(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("employeeId") Long employeeId,
            @Param("employeeCode") String employeeCode,
            @Param("employeeNamePattern") String employeeNamePattern,
            @Param("departmentId") Long departmentId,
            @Param("deviceId") Long deviceId,
            @Param("deviceNamePattern") String deviceNamePattern
    );
}