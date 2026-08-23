package com.haodaone.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CloseRequisitionRequest {
    @NotBlank(message = "Close reason is required")
    @Size(max = 80, message = "Close reason must be 80 characters or fewer")
    private String reason;

    @Size(max = 1000, message = "Close comments must be 1000 characters or fewer")
    private String comments;

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
}