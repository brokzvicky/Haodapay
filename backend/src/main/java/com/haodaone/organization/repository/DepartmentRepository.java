package com.haodaone.organization.repository;

import com.haodaone.organization.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findAllByDeletedFalseOrderByNameAsc();
    Optional<Department> findByCodeAndDeletedFalse(String code);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByCodeIgnoreCase(String code);
}
