package com.haodaone.attendance.repository;

import com.haodaone.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findAllByPunchTimeBetweenOrderByPunchTimeDesc(LocalDateTime start, LocalDateTime end);

    List<AttendanceRecord> findAllByEmployeeIdOrderByPunchTimeDesc(Long employeeId);

    List<AttendanceRecord> findAllByEmployeeIsNullOrderByPunchTimeDesc();

    Optional<AttendanceRecord> findByDeviceSerialNumberAndDeviceUserIdAndPunchTime(
            String deviceSerialNumber, String deviceUserId, LocalDateTime punchTime);

    long countByDeviceUserIdAndPunchTimeBetween(String deviceUserId, LocalDateTime start, LocalDateTime end);

    @Query("select count(distinct a.employee.id) from AttendanceRecord a where a.employee is not null and a.punchTime between :start and :end")
    long countDistinctEmployeesPunchedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
