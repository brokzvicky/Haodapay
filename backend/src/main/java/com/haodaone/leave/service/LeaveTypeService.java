package com.haodaone.leave.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.leave.dto.LeaveTypeDTO;
import com.haodaone.leave.entity.LeaveType;
import com.haodaone.leave.repository.LeaveTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeaveTypeService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final AuditLogService auditLogService;

    public LeaveTypeService(LeaveTypeRepository leaveTypeRepository, AuditLogService auditLogService) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.auditLogService = auditLogService;
    }

    public List<LeaveTypeDTO> listAll() {
        return leaveTypeRepository.findAllByDeletedFalseOrderByNameAsc().stream().map(LeaveTypeDTO::from).toList();
    }

    @Transactional
    public LeaveTypeDTO create(LeaveTypeDTO.CreateRequest request) {
        if (leaveTypeRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Leave type code '" + request.getCode() + "' is already in use");
        }
        LeaveType type = new LeaveType();
        type.setName(request.getName());
        type.setCode(request.getCode());
        type.setDefaultDaysPerYear(request.getDefaultDaysPerYear());
        type.setCarryForward(request.isCarryForward());

        LeaveType saved = leaveTypeRepository.save(type);
        auditLogService.log("LeaveType", saved.getId(), "CREATE", "Created leave type '" + saved.getName() + "'");
        return LeaveTypeDTO.from(saved);
    }
}
