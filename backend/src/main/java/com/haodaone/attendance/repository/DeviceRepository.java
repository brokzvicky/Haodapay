package com.haodaone.attendance.repository;

import com.haodaone.attendance.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    Optional<Device> findBySerialNumber(String serialNumber);
    List<Device> findAllByDeletedFalseOrderByDeviceNameAsc();
}
