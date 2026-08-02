package com.haodaone.organization.repository;

import com.haodaone.organization.entity.Designation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DesignationRepository extends JpaRepository<Designation, Long> {
    List<Designation> findAllByDeletedFalseOrderByTitleAsc();
    boolean existsByTitleIgnoreCase(String title);
}
