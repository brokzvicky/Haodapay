package com.haodaone.performance.repository;

import com.haodaone.performance.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findAllByEmployeeIdAndDeletedFalseOrderByTargetDateAsc(Long employeeId);
}
