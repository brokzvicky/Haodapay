package com.haodaone.recruitment.controller;

import com.haodaone.recruitment.dto.CandidateDTO;
import com.haodaone.recruitment.service.CandidateService;
import com.haodaone.recruitment.service.ResumeStorageService;
import jakarta.validation.Valid;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
public class CandidateController {

    private final CandidateService candidateService;
    private final ResumeStorageService resumeStorageService;

    public CandidateController(CandidateService candidateService, ResumeStorageService resumeStorageService) {
        this.candidateService = candidateService;
        this.resumeStorageService = resumeStorageService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('RECRUITMENT_VIEW')")
    public List<CandidateDTO> listAll(@RequestParam(required = false) Long jobOpeningId) {
        return candidateService.listAll(jobOpeningId);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('RECRUITMENT_VIEW')")
    public CandidateDTO getById(@PathVariable Long id) {
        return candidateService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public ResponseEntity<CandidateDTO> create(@Valid @RequestBody CandidateDTO.CreateRequest request) {
        return ResponseEntity.status(201).body(candidateService.create(request));
    }

    /** HR's initial screening decision on an APPLIED candidate: shortlist, hold, or reject (with optional reason, rating, remarks). */
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public CandidateDTO review(@PathVariable Long id, @Valid @RequestBody CandidateDTO.ReviewRequest request) {
        return candidateService.review(id, request);
    }

    /** Round-by-round advancement (or hold/reject) once past the initial review. */
    @PatchMapping("/{id}/advance")
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public CandidateDTO advance(@PathVariable Long id, @Valid @RequestBody CandidateDTO.AdvanceStageRequest request) {
        return candidateService.advance(id, request);
    }

    /** After Round 3 (final/management interview) clears. */
    @PostMapping("/{id}/generate-offer")
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public CandidateDTO generateOffer(@PathVariable Long id, @Valid @RequestBody CandidateDTO.OfferRequest request) {
        return candidateService.generateOffer(id, request);
    }

    /** Recorded by HR once the candidate confirms acceptance - auto-creates the employee profile and starts onboarding. */
    @PostMapping("/{id}/accept-offer")
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public CandidateDTO acceptOffer(@PathVariable Long id) {
        return candidateService.acceptOffer(id);
    }

    @GetMapping("/{id}/resume")
    @PreAuthorize("hasAuthority('RECRUITMENT_VIEW')")
    public ResponseEntity<InputStreamResource> downloadResume(@PathVariable Long id) {
        CandidateDTO candidate = candidateService.getById(id);
        InputStreamResource resource = resumeStorageService.retrieve(resumeKeyOf(id));
        String filename = candidate.getResumeOriginalName() != null ? candidate.getResumeOriginalName() : "resume";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename.replace("\"", "") + "\"")
                .body(resource);
    }

    /** The resume file key isn't part of CandidateDTO (only hasResume/resumeOriginalName are, to avoid leaking storage internals) - look it up directly for the download. */
    private String resumeKeyOf(Long candidateId) {
        return candidateService.getResumeKey(candidateId);
    }
}
