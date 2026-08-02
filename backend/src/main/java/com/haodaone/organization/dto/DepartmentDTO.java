package com.haodaone.organization.dto;

import com.haodaone.organization.entity.Department;

public class DepartmentDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private Long headEmployeeId;

    public static DepartmentDTO from(Department d) {
        DepartmentDTO dto = new DepartmentDTO();
        dto.id = d.getId();
        dto.name = d.getName();
        dto.code = d.getCode();
        dto.description = d.getDescription();
        dto.headEmployeeId = d.getHeadEmployeeId();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getCode() { return code; }
    public String getDescription() { return description; }
    public Long getHeadEmployeeId() { return headEmployeeId; }
}
