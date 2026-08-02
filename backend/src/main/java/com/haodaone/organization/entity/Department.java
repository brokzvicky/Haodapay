package com.haodaone.organization.entity;

import com.haodaone.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "department", uniqueConstraints = {
        @UniqueConstraint(columnNames = "name"),
        @UniqueConstraint(columnNames = "code")
})
public class Department extends BaseEntity {

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    /** Short code used in employee codes / badges, e.g. "ENG", "SALES". */
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(length = 500)
    private String description;

    /** Loosely coupled by design (plain id, not a JPA relationship) - avoids a
     *  hard circular dependency between the organization and employee packages. */
    @Column(name = "head_employee_id")
    private Long headEmployeeId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getHeadEmployeeId() { return headEmployeeId; }
    public void setHeadEmployeeId(Long headEmployeeId) { this.headEmployeeId = headEmployeeId; }
}
