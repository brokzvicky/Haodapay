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

    /** Candidates awaiting first review, scoped to a specific recruiter's own requisitions - see JobOpening.recruiter (V8 migration). */
    List<Candidate> findAllByJobOpening_Recruiter_IdAndStageAndDeletedFalseOrderByAppliedDateAsc(Long recruiterId, String stage);

    @Query("select c from Candidate c where c.stage = 'HIRED' and c.deleted = false and year(c.updatedAt) = :year")
    List<Candidate> findHiredInYear(@Param("year") int year);
}
