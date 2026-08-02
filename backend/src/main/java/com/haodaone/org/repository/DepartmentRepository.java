package com.haodaone.org.repository;

import com.haodaone.org.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findAllByDeletedFalseOrderByNameAsc();
    Optional<Department> findByCode(String code);
    boolean existsByCode(String code);
}
