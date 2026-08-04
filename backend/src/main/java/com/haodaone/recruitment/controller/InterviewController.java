package com.haodaone.recruitment.controller;

import com.haodaone.recruitment.dto.InterviewDTO;
import com.haodaone.recruitment.service.InterviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasAuthority('RECRUITMENT_VIEW')")
    public List<InterviewDTO> byCandidate(@PathVariable Long candidateId) {
        return interviewService.byCandidate(candidateId);
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAuthority('RECRUITMENT_VIEW')")
    public List<InterviewDTO> upcoming() {
        return interviewService.upcoming();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public ResponseEntity<InterviewDTO> schedule(@Valid @RequestBody InterviewDTO.CreateRequest request) {
        return ResponseEntity.status(201).body(interviewService.schedule(request));
    }

    @PatchMapping("/{id}/feedback")
    @PreAuthorize("hasAuthority('RECRUITMENT_MANAGE')")
    public InterviewDTO submitFeedback(@PathVariable Long id, @Valid @RequestBody InterviewDTO.FeedbackRequest request) {
        return interviewService.submitFeedback(id, request);
    }
}
