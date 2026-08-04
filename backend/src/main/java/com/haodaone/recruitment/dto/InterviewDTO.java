package com.haodaone.recruitment.dto;

import com.haodaone.recruitment.entity.Interview;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class InterviewDTO {
    private Long id;
    private Long candidateId;
    private String candidateName;
    private Long interviewerId;
    private String interviewerName;
    private LocalDateTime scheduledAt;
    private String mode;
    private String status;
    private Integer rating;
    private String feedback;

    public static InterviewDTO from(Interview i) {
        InterviewDTO dto = new InterviewDTO();
        dto.id = i.getId();
        dto.candidateId = i.getCandidate().getId();
        dto.candidateName = i.getCandidate().getFullName();
        dto.scheduledAt = i.getScheduledAt();
        dto.mode = i.getMode();
        dto.status = i.getStatus();
        dto.rating = i.getRating();
        dto.feedback = i.getFeedback();
        if (i.getInterviewer() != null) {
            dto.interviewerId = i.getInterviewer().getId();
            dto.interviewerName = i.getInterviewer().getFullName();
        }
        return dto;
    }

    public Long getId() {
        return id;
    }

    public Long getCandidateId() {
        return candidateId;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public Long getInterviewerId() {
        return interviewerId;
    }

    public String getInterviewerName() {
        return interviewerName;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public String getMode() {
        return mode;
    }

    public String getStatus() {
        return status;
    }

    public Integer getRating() {
        return rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public static class CreateRequest {
        @NotNull(message = "Candidate is required")
        private Long candidateId;
        private Long interviewerId;

        @NotNull(message = "Scheduled time is required")
        private LocalDateTime scheduledAt;

        private String mode = "VIDEO";

        public Long getCandidateId() {
            return candidateId;
        }

        public void setCandidateId(Long candidateId) {
            this.candidateId = candidateId;
        }

        public Long getInterviewerId() {
            return interviewerId;
        }

        public void setInterviewerId(Long interviewerId) {
            this.interviewerId = interviewerId;
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
    }

    public static class FeedbackRequest {
        @Min(1)
        @Max(5)
        private Integer rating;
        private String feedback;

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
}
