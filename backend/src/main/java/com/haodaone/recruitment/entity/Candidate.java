package com.haodaone.recruitment.entity;

import com.haodaone.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.time.LocalDate;

/**
 * Offer management is folded into this entity (offerAmount/
 * expectedJoiningDate) rather than a separate Offer entity - at this
 * phase's scope an offer is just terminal state on the candidate's
 * pipeline, not a multi-revision negotiation record. Split it out if/when
 * offer letters, approvals, or revision history are needed.
 */
@Entity
@Table(name = "candidate")
public class Candidate extends BaseEntity {

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_opening_id", nullable = false)
    private JobOpening jobOpening;

    /** e.g. "Referral", "LinkedIn", "Job Board" - free text by design, not a fixed list. */
    @Column(length = 100)
    private String source;

    @Column(name = "resume_url", length = 500)
    private String resumeUrl;

    /** APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED */
    @Column(nullable = false, length = 20)
    private String stage = "APPLIED";

    @Column(name = "applied_date", nullable = false)
    private LocalDate appliedDate;

    @Column(name = "offer_amount")
    private Double offerAmount;

    @Column(name = "expected_joining_date")
    private LocalDate expectedJoiningDate;

    @Column(length = 1000)
    private String notes;

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public JobOpening getJobOpening() {
        return jobOpening;
    }

    public void setJobOpening(JobOpening jobOpening) {
        this.jobOpening = jobOpening;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public void setResumeUrl(String resumeUrl) {
        this.resumeUrl = resumeUrl;
    }

    public String getStage() {
        return stage;
    }

    public void setStage(String stage) {
        this.stage = stage;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public void setAppliedDate(LocalDate appliedDate) {
        this.appliedDate = appliedDate;
    }

    public Double getOfferAmount() {
        return offerAmount;
    }

    public void setOfferAmount(Double offerAmount) {
        this.offerAmount = offerAmount;
    }

    public LocalDate getExpectedJoiningDate() {
        return expectedJoiningDate;
    }

    public void setExpectedJoiningDate(LocalDate expectedJoiningDate) {
        this.expectedJoiningDate = expectedJoiningDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
