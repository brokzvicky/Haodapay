package com.haodaone.leave.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.leave.dto.HolidayDTO;
import com.haodaone.leave.entity.Holiday;
import com.haodaone.leave.repository.HolidayRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final AuditLogService auditLogService;

    public HolidayService(HolidayRepository holidayRepository, AuditLogService auditLogService) {
        this.holidayRepository = holidayRepository;
        this.auditLogService = auditLogService;
    }

    public List<HolidayDTO> listAll() {
        return holidayRepository.findAllByDeletedFalseOrderByDateAsc().stream().map(HolidayDTO::from).toList();
    }

    @Transactional
    public HolidayDTO create(HolidayDTO.CreateRequest request) {
        if (holidayRepository.existsByDateAndDeletedFalse(request.getDate())) {
            throw new BadRequestException("A holiday is already recorded on " + request.getDate());
        }
        Holiday holiday = new Holiday();
        holiday.setName(request.getName());
        holiday.setDate(request.getDate());

        Holiday saved = holidayRepository.save(holiday);
        auditLogService.log("Holiday", saved.getId(), "CREATE", "Added holiday '" + saved.getName() + "' on " + saved.getDate());
        return HolidayDTO.from(saved);
    }

    @Transactional
    public void delete(Long id) {
        Holiday holiday = holidayRepository.findById(id).orElseThrow();
        holiday.setDeleted(true);
        holidayRepository.save(holiday);
        auditLogService.log("Holiday", id, "DELETE", "Removed holiday '" + holiday.getName() + "'");
    }
}
