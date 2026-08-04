package com.haodaone.recruitment.repository;

import com.haodaone.recruitment.entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findAllByCandidateIdAndDeletedFalseOrderByScheduledAtDesc(Long candidateId);
    List<Interview> findAllByStatusOrderByScheduledAtAsc(String status);
}
