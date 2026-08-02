package com.haodaone.organization.entity;

import com.haodaone.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "designation", uniqueConstraints = @UniqueConstraint(columnNames = "title"))
public class Designation extends BaseEntity {

    @Column(nullable = false, unique = true, length = 150)
    private String title;

    /** Free-text seniority band, e.g. "Junior", "Senior", "Lead", "Manager", "Director". */
    @Column(length = 50)
    private String level;

    /** Optional - some designations are department-specific, others are org-wide. */
    @Column(name = "department_id")
    private Long departmentId;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
}
