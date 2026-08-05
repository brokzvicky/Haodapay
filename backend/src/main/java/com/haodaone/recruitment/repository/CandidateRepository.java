package com.haodaone.recruitment.repository;

import com.haodaone.recruitment.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CandidateRepository extends JpaRepository<Candidate, Long> {

    @Query("""
        SELECT c
        FROM Candidate c
        LEFT JOIN FETCH c.jobOpening
        WHERE c.deleted = false
          AND c.jobOpening.id = :jobOpeningId
        ORDER BY c.appliedDate DESC
        """)
    List<Candidate> findAllByJobOpeningIdAndDeletedFalseOrderByAppliedDateDesc(
            @Param("jobOpeningId") Long jobOpeningId);

    @Query("""
        SELECT c
        FROM Candidate c
        LEFT JOIN FETCH c.jobOpening
        WHERE c.deleted = false
        ORDER BY c.appliedDate DESC
        """)
    List<Candidate> findAllByDeletedFalseOrderByAppliedDateDesc();

    @Query("""
        SELECT c
        FROM Candidate c
        LEFT JOIN FETCH c.jobOpening
        WHERE c.id = :id
          AND c.deleted = false
        """)
    Optional<Candidate> findByIdWithJobOpening(@Param("id") Long id);

    long countByJobOpeningIdAndDeletedFalse(Long jobOpeningId);

    long countByJobOpeningIdAndStageAndDeletedFalse(Long jobOpeningId, String stage);

    long countByDeletedFalse();

    long countByStageAndDeletedFalse(String stage);

    @Query("""
        select c
        from Candidate c
        where c.stage = 'HIRED'
          and c.deleted = false
          and year(c.updatedAt) = :year
        """)
    List<Candidate> findHiredInYear(@Param("year") int year);
}