package com.haodaone.recruitment.controller;

import com.haodaone.recruitment.dto.CandidateDTO;
import com.haodaone.recruitment.service.CandidateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('RECRUITMENT_VIEW')")
    public List<CandidateDTO> listAll(@RequestParam(required = false) Long jobOpeningId) {
        return candidateService.listAll(jobOpeningId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public ResponseEntity<CandidateDTO> create(@Valid @RequestBody CandidateDTO.CreateRequest request) {
        return ResponseEntity.status(201).body(candidateService.create(request));
    }

    @PatchMapping("/{id}/stage")
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public CandidateDTO updateStage(@PathVariable Long id, @Valid @RequestBody CandidateDTO.StageUpdateRequest request) {
        return candidateService.updateStage(id, request);
    }
}
