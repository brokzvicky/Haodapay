package com.haodaone.organization.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateDesignationRequest {
    @NotBlank(message = "Designation title is required")
    private String title;

    private String level;
    private Long departmentId;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
}
