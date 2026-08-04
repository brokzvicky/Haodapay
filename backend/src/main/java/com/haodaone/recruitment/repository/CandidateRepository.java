package com.haodaone.recruitment.repository;

import com.haodaone.recruitment.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findAllByJobOpeningIdAndDeletedFalseOrderByAppliedDateDesc(Long jobOpeningId);
    List<Candidate> findAllByDeletedFalseOrderByAppliedDateDesc();
    long countByJobOpeningIdAndDeletedFalse(Long jobOpeningId);
    long countByJobOpeningIdAndStageAndDeletedFalse(Long jobOpeningId, String stage);
    long countByDeletedFalse();
    long countByStageAndDeletedFalse(String stage);

    @Query("select c from Candidate c where c.stage = 'HIRED' and c.deleted = false and year(c.updatedAt) = :year")
    List<Candidate> findHiredInYear(@Param("year") int year);
}
