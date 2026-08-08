package com.haodaone.attendance.controller;

import com.haodaone.attendance.dto.AttendanceRecordDTO;
import com.haodaone.attendance.repository.AttendanceRecordRepository;
import com.haodaone.attendance.service.AttendanceEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceEventPublisher eventPublisher;

    public AttendanceController(AttendanceRecordRepository attendanceRecordRepository, AttendanceEventPublisher eventPublisher) {
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.eventPublisher = eventPublisher;
    }

    /** Defaults to today - the Live Attendance view's primary query. */
    @GetMapping
    @PreAuthorize("hasAuthority('ATTENDANCE_VIEW')")
    public List<AttendanceRecordDTO> byDate(@RequestParam(required = false) String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return attendanceRecordRepository.findAllByPunchTimeBetweenOrderByPunchTimeDesc(start, end).stream()
                .map(AttendanceRecordDTO::from)
                .toList();
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAuthority('ATTENDANCE_VIEW')")
    public List<AttendanceRecordDTO> byEmployee(@PathVariable Long employeeId) {
        return attendanceRecordRepository.findAllByEmployeeIdOrderByPunchTimeDesc(employeeId).stream()
                .map(AttendanceRecordDTO::from)
                .toList();
    }

    /** Punches from PINs that haven't been mapped to an Employee yet - surfaces gaps in biometric enrollment. */
    @GetMapping("/unmapped")
    @PreAuthorize("hasAuthority('ATTENDANCE_MANAGE')")
    public List<AttendanceRecordDTO> unmapped() {
        return attendanceRecordRepository.findAllByEmployeeIsNullOrderByPunchTimeDesc().stream()
                .map(AttendanceRecordDTO::from)
                .toList();
    }

    @GetMapping("/stream")
    @PreAuthorize("hasAuthority('ATTENDANCE_VIEW')")
    public SseEmitter stream() {
        return eventPublisher.subscribe();
    }
}
