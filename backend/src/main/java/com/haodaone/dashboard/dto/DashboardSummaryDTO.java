package com.haodaone.dashboard.dto;

import com.haodaone.employee.dto.EmployeeSummaryDTO;

import java.util.List;

public class DashboardSummaryDTO {
    private long totalEmployees;
    private long activeEmployees;
    private long onLeave;
    private long noticePeriod;
    private long resigned;
    private long terminated;
    private List<DepartmentCount> departmentBreakdown;
    private List<EmployeeSummaryDTO> recentJoiners;

    public DashboardSummaryDTO(long totalEmployees, long activeEmployees, long onLeave, long noticePeriod,
                                long resigned, long terminated, List<DepartmentCount> departmentBreakdown,
                                List<EmployeeSummaryDTO> recentJoiners) {
        this.totalEmployees = totalEmployees;
        this.activeEmployees = activeEmployees;
        this.onLeave = onLeave;
        this.noticePeriod = noticePeriod;
        this.resigned = resigned;
        this.terminated = terminated;
        this.departmentBreakdown = departmentBreakdown;
        this.recentJoiners = recentJoiners;
    }

    public long getTotalEmployees() {
        return totalEmployees;
    }

    public long getActiveEmployees() {
        return activeEmployees;
    }

    public long getOnLeave() {
        return onLeave;
    }

    public long getNoticePeriod() {
        return noticePeriod;
    }

    public long getResigned() {
        return resigned;
    }

    public long getTerminated() {
        return terminated;
    }

    public List<DepartmentCount> getDepartmentBreakdown() {
        return departmentBreakdown;
    }

    public List<EmployeeSummaryDTO> getRecentJoiners() {
        return recentJoiners;
    }

    public static class DepartmentCount {
        private final String departmentName;
        private final long count;

        public DepartmentCount(String departmentName, long count) {
            this.departmentName = departmentName;
            this.count = count;
        }

        public String getDepartmentName() {
            return departmentName;
        }

        public long getCount() {
            return count;
        }
    }
}
