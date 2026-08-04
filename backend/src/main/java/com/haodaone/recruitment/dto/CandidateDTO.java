package com.haodaone.recruitment.dto;

import com.haodaone.recruitment.entity.Candidate;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CandidateDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private Long jobOpeningId;
    private String jobOpeningTitle;
    private String source;
    private String resumeUrl;
    private String stage;
    private LocalDate appliedDate;
    private Double offerAmount;
    private LocalDate expectedJoiningDate;
    private String notes;

    public static CandidateDTO from(Candidate c) {
        CandidateDTO dto = new CandidateDTO();
        dto.id = c.getId();
        dto.firstName = c.getFirstName();
        dto.lastName = c.getLastName();
        dto.fullName = c.getFullName();
        dto.email = c.getEmail();
        dto.phone = c.getPhone();
        dto.jobOpeningId = c.getJobOpening().getId();
        dto.jobOpeningTitle = c.getJobOpening().getTitle();
        dto.source = c.getSource();
        dto.resumeUrl = c.getResumeUrl();
        dto.stage = c.getStage();
        dto.appliedDate = c.getAppliedDate();
        dto.offerAmount = c.getOfferAmount();
        dto.expectedJoiningDate = c.getExpectedJoiningDate();
        dto.notes = c.getNotes();
        return dto;
    }

    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public Long getJobOpeningId() {
        return jobOpeningId;
    }

    public String getJobOpeningTitle() {
        return jobOpeningTitle;
    }

    public String getSource() {
        return source;
    }

    public String getResumeUrl() {
        return resumeUrl;
    }

    public String getStage() {
        return stage;
    }

    public LocalDate getAppliedDate() {
        return appliedDate;
    }

    public Double getOfferAmount() {
        return offerAmount;
    }

    public LocalDate getExpectedJoiningDate() {
        return expectedJoiningDate;
    }

    public String getNotes() {
        return notes;
    }

    public static class CreateRequest {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        private String email;

        private String phone;

        @NotNull(message = "Job opening is required")
        private Long jobOpeningId;

        private String source;
        private String resumeUrl;
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

        public Long getJobOpeningId() {
            return jobOpeningId;
        }

        public void setJobOpeningId(Long jobOpeningId) {
            this.jobOpeningId = jobOpeningId;
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

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class StageUpdateRequest {
        @NotBlank(message = "Stage is required")
        private String stage;
        private Double offerAmount;
        private LocalDate expectedJoiningDate;

        public String getStage() {
            return stage;
        }

        public void setStage(String stage) {
            this.stage = stage;
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
    }
}
