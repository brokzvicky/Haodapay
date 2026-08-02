package com.haodaone.leave.repository;

import com.haodaone.leave.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {
    List<LeaveType> findAllByDeletedFalseOrderByNameAsc();
    Optional<LeaveType> findByCode(String code);
    boolean existsByCode(String code);
}
