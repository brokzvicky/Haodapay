package com.haodaone.recruitment.entity;

import com.haodaone.common.entity.BaseEntity;
import com.haodaone.employee.entity.Employee;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview")
public class Interview extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_employee_id")
    private Employee interviewer;

    /** 1, 2, or 3 - see Candidate's class doc for the ROUND1/ROUND2/ROUND3 stage mapping. */
    @Column(name = "round_number", nullable = false)
    private int roundNumber = 1;

    /** HR_INTERVIEW (round 1), HIRING_MANAGER (round 2), FINAL (round 3, management). */
    @Column(name = "round_type", nullable = false, length = 30)
    private String roundType = "HR_INTERVIEW";

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    /** ONSITE, VIDEO, PHONE */
    @Column(nullable = false, length = 20)
    private String mode = "VIDEO";

    /** SCHEDULED, COMPLETED, CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";

    /** 1-5, set once feedback is submitted */
    private Integer rating;

    @Column(length = 1000)
    private String feedback;

    public Candidate getCandidate() {
        return candidate;
    }

    public void setCandidate(Candidate candidate) {
        this.candidate = candidate;
    }

    public Employee getInterviewer() {
        return interviewer;
    }

    public void setInterviewer(Employee interviewer) {
        this.interviewer = interviewer;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public void setRoundNumber(int roundNumber) {
        this.roundNumber = roundNumber;
    }

    public String getRoundType() {
        return roundType;
    }

    public void setRoundType(String roundType) {
        this.roundType = roundType;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
