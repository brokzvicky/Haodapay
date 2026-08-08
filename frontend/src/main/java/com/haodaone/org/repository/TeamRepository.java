package com.haodaone.org.repository;

import com.haodaone.org.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findAllByDeletedFalseOrderByNameAsc();
}
