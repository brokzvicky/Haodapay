package com.haodaone.organization.dto;

import com.haodaone.organization.entity.Designation;

public class DesignationDTO {
    private Long id;
    private String title;
    private String level;
    private Long departmentId;

    public static DesignationDTO from(Designation d) {
        DesignationDTO dto = new DesignationDTO();
        dto.id = d.getId();
        dto.title = d.getTitle();
        dto.level = d.getLevel();
        dto.departmentId = d.getDepartmentId();
        return dto;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getLevel() { return level; }
    public Long getDepartmentId() { return departmentId; }
}
