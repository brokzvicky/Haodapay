package com.haodaone.leave.entity;

import com.haodaone.common.entity.BaseEntity;
import jakarta.persistence.*;

/** e.g. "Casual Leave", "Sick Leave", "Earned Leave". defaultDaysPerYear seeds new LeaveBalance rows; each employee's actual allocation can still be adjusted individually. */
@Entity
@Table(name = "leave_type", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
public class LeaveType extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "default_days_per_year", nullable = false)
    private double defaultDaysPerYear;

    @Column(name = "carry_forward", nullable = false)
    private boolean carryForward = false;

    @Column(nullable = false)
    private boolean active = true;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public double getDefaultDaysPerYear() {
        return defaultDaysPerYear;
    }

    public void setDefaultDaysPerYear(double defaultDaysPerYear) {
        this.defaultDaysPerYear = defaultDaysPerYear;
    }

    public boolean isCarryForward() {
        return carryForward;
    }

    public void setCarryForward(boolean carryForward) {
        this.carryForward = carryForward;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
