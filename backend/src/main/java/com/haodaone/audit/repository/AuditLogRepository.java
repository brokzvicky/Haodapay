package com.haodaone.audit.repository;

import com.haodaone.audit.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByPerformedAtDesc(Pageable pageable);

    Page<AuditLog> findByEntityNameOrderByPerformedAtDesc(String entityName, Pageable pageable);

    /** Used by modules (e.g. Salary's "Recent Payroll Activity") whose entries span more than one entityName. */
    Page<AuditLog> findByEntityNameInOrderByPerformedAtDesc(Collection<String> entityNames, Pageable pageable);
}
