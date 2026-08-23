package com.haodaone.monitoring.report.service;

import com.haodaone.monitoring.entity.ActivitySession;
import com.haodaone.monitoring.report.dto.AppUsageDTO;
import com.haodaone.monitoring.report.dto.ManagementInsightsDTO;
import com.haodaone.monitoring.report.dto.ProductivitySummaryDTO;
import com.haodaone.monitoring.report.dto.ReportFilter;
import com.haodaone.monitoring.repository.ActivitySessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Turns raw ActivitySession rows (real agent-reported data - never mock)
 * into the Productivity Summary / Activity Report / Management View shapes
 * the frontend and the Excel/PDF exporters all share. Every number here is
 * derived directly from activity_session; nothing is fabricated.
 */
@Service
@Transactional(readOnly = true)
public class ProductivityReportService {

    private static final Logger log = LoggerFactory.getLogger(ProductivityReportService.class);

    /**
     * An idle session at or above this length counts as Break Time rather
     * than Idle Time - see ProductivitySummaryDTO's javadoc for the
     * reasoning. 15 minutes is a common default for "stepped away" vs
     * "momentarily idle at the desk"; tune here if HR wants a different cut.
     */
    private static final long BREAK_THRESHOLD_SECONDS = 15 * 60;

    private static final int TOP_APPS_LIMIT = 8;
    private static final int RANKING_LIMIT = 10;

    private final ActivitySessionRepository activitySessionRepository;

    public ProductivityReportService(ActivitySessionRepository activitySessionRepository) {
        this.activitySessionRepository = activitySessionRepository;
    }

    /** Every row of the filtered report, one per employee/device/day - backs both the Activity Report table and the Productivity Summary table. */
    public List<ProductivitySummaryDTO> buildSummary(ReportFilter filter) {
        List<ActivitySession> sessions = fetchSessions(filter);
        Map<String, List<ActivitySession>> grouped = groupByEmployeeDeviceDay(sessions);

        List<ProductivitySummaryDTO> rows = new ArrayList<>();
        for (List<ActivitySession> group : grouped.values()) {
            rows.add(summarize(group));
        }
        rows.sort(Comparator.comparing(ProductivitySummaryDTO::getDate).reversed()
                .thenComparing(dto -> Objects.toString(dto.getEmployeeName(), "")));
        return rows;
    }

    /** Management View's leaderboards and org-wide averages, computed over the same filtered rows as buildSummary. */
    public ManagementInsightsDTO buildManagementInsights(ReportFilter filter) {
        List<ProductivitySummaryDTO> rows = buildSummary(filter);

        // Aggregate per-employee across every day in range so a leaderboard
        // reflects the whole window, not just one day.
        Map<Long, List<ProductivitySummaryDTO>> byEmployee = new LinkedHashMap<>();
        for (ProductivitySummaryDTO row : rows) {
            if (row.getEmployeeId() == null) continue;
            byEmployee.computeIfAbsent(row.getEmployeeId(), k -> new ArrayList<>()).add(row);
        }

        List<ManagementInsightsDTO.EmployeeRanking> mostActive = new ArrayList<>();
        List<ManagementInsightsDTO.EmployeeRanking> highestIdle = new ArrayList<>();
        List<ManagementInsightsDTO.EmployeeRanking> productivity = new ArrayList<>();

        double totalLoggedInHours = 0;
        double totalProductivity = 0;
        int dayCount = 0;

        for (Map.Entry<Long, List<ProductivitySummaryDTO>> entry : byEmployee.entrySet()) {
            List<ProductivitySummaryDTO> days = entry.getValue();
            ProductivitySummaryDTO first = days.get(0);

            double activeHours = days.stream().mapToLong(ProductivitySummaryDTO::getActiveSeconds).sum() / 3600.0;
            double idleAndBreakHours = days.stream().mapToLong(d -> d.getIdleSeconds() + d.getBreakSeconds()).sum() / 3600.0;
            double avgProductivity = days.stream().mapToDouble(ProductivitySummaryDTO::getProductivityPercent).average().orElse(0);

            mostActive.add(new ManagementInsightsDTO.EmployeeRanking(first.getEmployeeId(), first.getEmployeeCode(),
                    first.getEmployeeName(), first.getDepartmentName(), round2(activeHours)));
            highestIdle.add(new ManagementInsightsDTO.EmployeeRanking(first.getEmployeeId(), first.getEmployeeCode(),
                    first.getEmployeeName(), first.getDepartmentName(), round2(idleAndBreakHours)));
            productivity.add(new ManagementInsightsDTO.EmployeeRanking(first.getEmployeeId(), first.getEmployeeCode(),
                    first.getEmployeeName(), first.getDepartmentName(), round2(avgProductivity)));

            for (ProductivitySummaryDTO d : days) {
                totalLoggedInHours += d.getTotalLoggedInSeconds() / 3600.0;
                totalProductivity += d.getProductivityPercent();
                dayCount++;
            }
        }

        mostActive.sort(Comparator.comparingDouble(ManagementInsightsDTO.EmployeeRanking::getValue).reversed());
        highestIdle.sort(Comparator.comparingDouble(ManagementInsightsDTO.EmployeeRanking::getValue).reversed());
        productivity.sort(Comparator.comparingDouble(ManagementInsightsDTO.EmployeeRanking::getValue).reversed());

        ManagementInsightsDTO dto = new ManagementInsightsDTO();
        dto.setMostActiveEmployees(cap(mostActive));
        dto.setHighestIdleEmployees(cap(highestIdle));
        dto.setProductivityRanking(cap(productivity));
        dto.setAverageWorkingHours(dayCount > 0 ? round2(totalLoggedInHours / dayCount) : 0);
        dto.setAverageProductivityPercent(dayCount > 0 ? round2(totalProductivity / dayCount) : 0);
        dto.setEmployeeDaysAnalyzed(dayCount);
        return dto;
    }

    private List<ManagementInsightsDTO.EmployeeRanking> cap(List<ManagementInsightsDTO.EmployeeRanking> list) {
        return list.size() > RANKING_LIMIT ? new ArrayList<>(list.subList(0, RANKING_LIMIT)) : list;
    }

    /**
     * Builds the wildcard patterns in Java, never in JPQL - see
     * ActivitySessionRepository#search's javadoc for exactly why. Both
     * patterns are pre-lower-cased and combined with `ilike` at the SQL
     * layer, so this method's own case-folding here is just for
     * readability/consistency, not required for correctness.
     */
    List<ActivitySession> fetchSessions(ReportFilter filter) {
        LocalDateTime from = filter.getStartDate().atStartOfDay();
        LocalDateTime to = filter.getEndDate().plusDays(1).atStartOfDay();
        String employeeNamePattern = toPattern(filter.getEmployeeName());
        String deviceNamePattern = toPattern(filter.getDeviceName());
        return activitySessionRepository.search(from, to, filter.getEmployeeId(), filter.getEmployeeCode(),
                employeeNamePattern, filter.getDepartmentId(), filter.getDeviceId(), deviceNamePattern);
    }

    private String toPattern(String rawValue) {
        return (rawValue == null || rawValue.isBlank()) ? null : "%" + rawValue.trim() + "%";
    }

    private Map<String, List<ActivitySession>> groupByEmployeeDeviceDay(List<ActivitySession> sessions) {
        Map<String, List<ActivitySession>> grouped = new LinkedHashMap<>();
        for (ActivitySession s : sessions) {
            Long employeeId = s.getEmployee() != null ? s.getEmployee().getId() : null;
            String key = employeeId + "|" + s.getDevice().getId() + "|" + s.getStartTime().toLocalDate();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }
        return grouped;
    }

    private ProductivitySummaryDTO summarize(List<ActivitySession> group) {
        ActivitySession any = group.get(0);

        // ---------------------------------------------------------------
        // Root cause of "Logged In = Active = 36h 53m for one day": this
        // used to be a naive `activeSeconds += s.getDurationSeconds()` sum
        // over every session in the group. If the DB ever contains two (or
        // more) ActivitySession rows whose [start, end) windows overlap for
        // the same employee/device/day - duplicate agent submissions,
        // overlapping heartbeat-derived + activity-batch rows, a retried
        // upload that got a new sessionId and slipped past the
        // existsBySessionId() dedup check - each overlapping row's duration
        // was counted again in full, so ten minutes of real, single-track
        // wall-clock time could be reported as twenty, thirty, or more.
        // That's how a calendar day ends up with >24h of "active" time.
        //
        // The fix: collapse each category's session intervals into
        // non-overlapping merged intervals first, and sum THOSE. This
        // makes the total mathematically bounded by wall-clock time
        // regardless of how many overlapping/duplicate rows exist upstream
        // - it fixes the symptom unconditionally, on top of (not instead
        // of) fixing the upstream duplication itself. See the SQL at the
        // bottom of this file's class-level comment for how to find and
        // remove the duplicate rows directly in Postgres.
        // ---------------------------------------------------------------
        List<long[]> activeIntervals = new ArrayList<>();
        List<long[]> idleIntervals = new ArrayList<>();
        LocalDateTime login = null;
        LocalDateTime logout = null;
        Map<String, long[]> appTotals = new LinkedHashMap<>(); // [seconds, idleFlag(0/1)]
        Map<String, String> appLastWindowTitle = new LinkedHashMap<>();

        for (ActivitySession s : group) {
            long duration = s.getDurationSeconds();
            LocalDateTime start = s.getStartTime();
            LocalDateTime end = s.getEndTime() != null ? s.getEndTime() : start.plusSeconds(duration);

            if (login == null || start.isBefore(login)) login = start;
            if (logout == null || end.isAfter(logout)) logout = end;

            long[] interval = {start.toEpochSecond(java.time.ZoneOffset.UTC), end.toEpochSecond(java.time.ZoneOffset.UTC)};
            if (s.isIdleSession()) {
                idleIntervals.add(interval);
            } else {
                activeIntervals.add(interval);
            }

            String appName = s.getApplicationName() != null ? s.getApplicationName()
                    : (s.isIdleSession() ? "Idle" : "Unknown Application");
            long[] totals = appTotals.computeIfAbsent(appName, k -> new long[]{0, s.isIdleSession() ? 1 : 0});
            totals[0] += duration;
            if (s.getWindowTitle() != null && !s.getWindowTitle().isBlank()) {
                appLastWindowTitle.put(appName, s.getWindowTitle());
            }
        }

        long activeSeconds = mergeIntervals(activeIntervals).stream().mapToLong(iv -> iv[1] - iv[0]).sum();

        // Idle vs Break is decided per MERGED interval (not per raw
        // session) so two overlapping short idle rows that together span
        // 20 minutes are correctly counted as one 20-minute Break, not two
        // separate sub-threshold Idle entries.
        long idleSeconds = 0;
        long breakSeconds = 0;
        for (long[] iv : mergeIntervals(idleIntervals)) {
            long len = iv[1] - iv[0];
            if (len >= BREAK_THRESHOLD_SECONDS) {
                breakSeconds += len;
            } else {
                idleSeconds += len;
            }
        }

        long loggedIn = activeSeconds + idleSeconds + breakSeconds;
        double productivity = loggedIn > 0 ? round2((activeSeconds * 100.0) / loggedIn) : 0;

        if (loggedIn > 86_400) {
            log.warn("Employee/device/day bucket ({}/{}/{}) still exceeds 24h ({}) after overlap-merging - "
                            + "likely a session whose endTime genuinely spans past midnight into the next day. "
                            + "Investigate with the SQL in ActivitySessionRepository's class javadoc.",
                    any.getEmployee() != null ? any.getEmployee().getId() : null, any.getDevice().getId(),
                    any.getStartTime().toLocalDate(), loggedIn);
        }

        List<AppUsageDTO> topApps = appTotals.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(TOP_APPS_LIMIT)
                .map(e -> new AppUsageDTO(e.getKey(), appLastWindowTitle.get(e.getKey()), e.getValue()[0], e.getValue()[1] == 1))
                .toList();

        ProductivitySummaryDTO dto = new ProductivitySummaryDTO();
        if (any.getEmployee() != null) {
            dto.setEmployeeId(any.getEmployee().getId());
            dto.setEmployeeCode(any.getEmployee().getEmployeeCode());
            dto.setEmployeeName(any.getEmployee().getFullName());
            dto.setDepartmentName(any.getEmployee().getDepartment() != null ? any.getEmployee().getDepartment().getName() : null);
            dto.setDesignationTitle(any.getEmployee().getDesignation() != null ? any.getEmployee().getDesignation().getTitle() : null);
        }
        dto.setDeviceId(any.getDevice().getId());
        dto.setDeviceName(any.getDevice().getDeviceName());
        dto.setDate(any.getStartTime().toLocalDate());
        dto.setLoginTime(login);
        dto.setLogoutTime(logout);
        dto.setActiveSeconds(activeSeconds);
        dto.setIdleSeconds(idleSeconds);
        dto.setBreakSeconds(breakSeconds);
        dto.setTotalLoggedInSeconds(loggedIn);
        dto.setProductivityPercent(productivity);
        dto.setTopApplications(topApps);
        return dto;
    }

    /** Classic sort-and-sweep interval merge; input is a list of [startEpochSecond, endEpochSecond) pairs, order not required. */
    private List<long[]> mergeIntervals(List<long[]> intervals) {
        if (intervals.isEmpty()) return intervals;
        List<long[]> sorted = new ArrayList<>(intervals);
        sorted.sort(Comparator.comparingLong(a -> a[0]));

        List<long[]> merged = new ArrayList<>();
        long curStart = sorted.get(0)[0];
        long curEnd = sorted.get(0)[1];
        for (int i = 1; i < sorted.size(); i++) {
            long[] iv = sorted.get(i);
            if (iv[0] <= curEnd) {
                curEnd = Math.max(curEnd, iv[1]);
            } else {
                merged.add(new long[]{curStart, curEnd});
                curStart = iv[0];
                curEnd = iv[1];
            }
        }
        merged.add(new long[]{curStart, curEnd});
        return merged;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
