package com.haodaone.recruitment.entity;

import com.haodaone.common.entity.BaseEntity;
import com.haodaone.org.entity.Department;
import com.haodaone.org.entity.Designation;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "job_opening")
public class JobOpening extends BaseEntity {

    @Column(nullable = false, length = 150)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "designation_id")
    private Designation designation;

    @Column(name = "employment_type", nullable = false, length = 20)
    private String employmentType = "FULL_TIME";

    @Column(name = "openings_count", nullable = false)
    private int openingsCount = 1;

    /** OPEN, ON_HOLD, CLOSED */
    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(length = 2000)
    private String description;

    @Column(name = "posted_date")
    private LocalDate postedDate;

    @Column(name = "closed_date")
    private LocalDate closedDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Designation getDesignation() {
        return designation;
    }

    public void setDesignation(Designation designation) {
        this.designation = designation;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public int getOpeningsCount() {
        return openingsCount;
    }

    public void setOpeningsCount(int openingsCount) {
        this.openingsCount = openingsCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getPostedDate() {
        return postedDate;
    }

    public void setPostedDate(LocalDate postedDate) {
        this.postedDate = postedDate;
    }

    public LocalDate getClosedDate() {
        return closedDate;
    }

    public void setClosedDate(LocalDate closedDate) {
        this.closedDate = closedDate;
    }
}
