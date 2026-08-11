package com.haodaone.recruitment.repository;

import com.haodaone.recruitment.entity.JobOpening;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobOpeningRepository extends JpaRepository<JobOpening, Long> {
    List<JobOpening> findAllByDeletedFalseOrderByPostedDateDesc();
    List<JobOpening> findAllByStatusAndDeletedFalseOrderByPostedDateDesc(String status);
    long countByStatusAndDeletedFalse(String status);

    /** A recruiter's own open requisitions - powers the Recruiter persona dashboard. */
    List<JobOpening> findAllByRecruiter_IdAndDeletedFalseAndStatusOrderByPostedDateDesc(Long recruiterId, String status);
}
