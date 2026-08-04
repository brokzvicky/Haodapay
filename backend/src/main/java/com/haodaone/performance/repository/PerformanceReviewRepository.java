package com.haodaone.performance.repository;

import com.haodaone.performance.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerformanceReviewRepository extends JpaRepository<PerformanceReview, Long> {
    List<PerformanceReview> findAllByEmployeeIdAndDeletedFalseOrderByCreatedAtDesc(Long employeeId);
    List<PerformanceReview> findAllByDeletedFalseOrderByCreatedAtDesc();
}
