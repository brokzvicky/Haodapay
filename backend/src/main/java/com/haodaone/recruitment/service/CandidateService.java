package com.haodaone.recruitment.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.employee.dto.CreateEmployeeRequest;
import com.haodaone.employee.dto.EmployeeDetailDTO;
import com.haodaone.employee.entity.Employee;
import com.haodaone.employee.repository.EmployeeRepository;
import com.haodaone.employee.service.EmployeeService;
import com.haodaone.recruitment.dto.CandidateDTO;
import com.haodaone.recruitment.entity.Candidate;
import com.haodaone.recruitment.entity.Interview;
import com.haodaone.recruitment.entity.JobOpening;
import com.haodaone.recruitment.repository.CandidateRepository;
import com.haodaone.recruitment.repository.InterviewRepository;
import com.haodaone.recruitment.repository.JobOpeningRepository;
import com.haodaone.user.dto.CreateUserRequest;
import com.haodaone.user.dto.UserDTO;
import com.haodaone.user.entity.User;
import com.haodaone.user.repository.UserRepository;
import com.haodaone.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CandidateService {

    /** Full pipeline vocabulary - see Candidate's class doc for the stage diagram. */
    private static final Set<String> VALID_STAGES = Set.of(
            "APPLIED", "SHORTLISTED", "HOLD", "ROUND1", "ROUND2", "ROUND3", "OFFERED", "HIRED", "REJECTED");

    /** Decisions the initial HR review (on an APPLIED candidate) can make. */
    private static final Set<String> REVIEW_DECISIONS = Set.of("SHORTLISTED", "HOLD", "REJECTED");

    /**
     * Every other controlled transition. REJECTED is reachable from any
     * key here (enforced separately below, not repeated in every set) -
     * this map only needs to list the "positive" moves.
     */
    private static final Map<String, Set<String>> ALLOWED_ADVANCES = Map.of(
            "SHORTLISTED", Set.of("ROUND1", "HOLD"),
            "HOLD", Set.of("SHORTLISTED", "ROUND1", "ROUND2", "ROUND3"),
            "ROUND1", Set.of("ROUND2", "HOLD"),
            "ROUND2", Set.of("ROUND3", "HOLD"),
            "ROUND3", Set.of("HOLD"));

    private static final Set<String> TERMINAL_STAGES = Set.of("HIRED", "REJECTED");

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String TEMP_PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";

    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;
    private final ResumeStorageService resumeStorageService;
    private final EmployeeService employeeService;
    private final AuditLogService auditLogService;
    private final InterviewRepository interviewRepository;
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;
    private final UserService userService;
    private final UserRepository userRepository;

    public CandidateService(CandidateRepository candidateRepository, JobOpeningRepository jobOpeningRepository,
                             ResumeStorageService resumeStorageService, EmployeeService employeeService,
                             AuditLogService auditLogService, InterviewRepository interviewRepository,
                             EmployeeRepository employeeRepository, EmailService emailService,
                             UserService userService, UserRepository userRepository) {
        this.candidateRepository = candidateRepository;
        this.jobOpeningRepository = jobOpeningRepository;
        this.resumeStorageService = resumeStorageService;
        this.employeeService = employeeService;
        this.auditLogService = auditLogService;
        this.interviewRepository = interviewRepository;
        this.employeeRepository = employeeRepository;
        this.emailService = emailService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     * @Transactional(readOnly = true) is required here, not optional: with
     * spring.jpa.open-in-view=false (correctly set - see application.properties),
     * the Hibernate session normally closes the instant the repository call
     * returns. Candidate.jobOpening is FetchType.LAZY, and CandidateDTO.from()
     * calls jobOpening.getTitle() - a real field, not the FK id, so Hibernate
     * must hit the DB to initialize that proxy. Without an open session at
     * that point, it throws LazyInitializationException, which
     * GlobalExceptionHandler's catch-all turns into the generic 500 "Something
     * went wrong" the frontend shows. Keeping the transaction open for the
     * whole method (including the DTO mapping) fixes that permanently.
     */
    @Transactional(readOnly = true)
    public List<CandidateDTO> listAll(Long jobOpeningId) {
        List<Candidate> candidates = jobOpeningId != null
                ? candidateRepository.findAllByJobOpeningIdAndDeletedFalseOrderByAppliedDateDesc(jobOpeningId)
                : candidateRepository.findAllByDeletedFalseOrderByAppliedDateDesc();
        return candidates.stream().map(CandidateDTO::from).toList();
    }

    /** See listAll()'s javadoc - same lazy-jobOpening issue applies here. */
    @Transactional(readOnly = true)
    public CandidateDTO getById(Long id) {
        return CandidateDTO.from(findActiveOrThrow(id));
    }

    /** Resume storage key isn't exposed on CandidateDTO (only hasResume/resumeOriginalName are) - the download endpoint needs the raw key. */
    public String getResumeKey(Long id) {
        return findActiveOrThrow(id).getResumeFileKey();
    }

    /** Manual add by HR (e.g. a referral) - no resume file, optionally a resumeUrl link. */
    @Transactional
    public CandidateDTO create(CandidateDTO.CreateRequest request) {
        JobOpening opening = jobOpeningRepository.findById(request.getJobOpeningId())
                .orElseThrow(() -> new BadRequestException("Unknown job opening: " + request.getJobOpeningId()));

        Candidate candidate = new Candidate();
        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setEmail(request.getEmail());
        candidate.setPhone(request.getPhone());
        candidate.setJobOpening(opening);
        candidate.setSource(request.getSource() != null ? request.getSource() : "Manual Entry");
        candidate.setResumeUrl(request.getResumeUrl());
        candidate.setExperienceYears(request.getExperienceYears());
        candidate.setSkills(request.getSkills());
        candidate.setNotes(request.getNotes());
        candidate.setAppliedDate(LocalDate.now());
        candidate.setStage("APPLIED");

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "CREATE",
                "Added '" + saved.getFullName() + "' to the pipeline for '" + opening.getTitle() + "'");
        return CandidateDTO.from(saved);
    }

    /**
     * Public, unauthenticated application from the Careers page. Rejects
     * applications to a job that isn't currently OPEN, even if the id is
     * still guessable/bookmarked from when it was.
     */
    @Transactional
    public CandidateDTO apply(CandidateDTO.PublicApplicationRequest request, MultipartFile resume) {
        JobOpening opening = jobOpeningRepository.findById(request.getJobOpeningId())
                .orElseThrow(() -> new BadRequestException("This job opening no longer exists."));
        if (!"OPEN".equals(opening.getStatus())) {
            throw new BadRequestException("This job opening is no longer accepting applications.");
        }

        Candidate candidate = new Candidate();
        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setEmail(request.getEmail());
        candidate.setPhone(request.getPhone());
        candidate.setJobOpening(opening);
        candidate.setSource("Careers Page");
        candidate.setExperienceYears(request.getExperienceYears());
        candidate.setSkills(request.getSkills());
        candidate.setNotes(request.getNotes());
        candidate.setAppliedDate(LocalDate.now());
        candidate.setStage("APPLIED");

        if (resume != null && !resume.isEmpty()) {
            String key = resumeStorageService.store(resume);
            candidate.setResumeFileKey(key);
            candidate.setResumeOriginalName(resume.getOriginalFilename());
        }

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "CREATE",
                "'" + saved.getFullName() + "' applied via Careers page for '" + opening.getTitle() + "'");
        return CandidateDTO.from(saved);
    }

    /** HR's initial screening decision on an APPLIED candidate: shortlist, hold, or reject. */
    @Transactional
    public CandidateDTO review(Long id, CandidateDTO.ReviewRequest request) {
        if (!REVIEW_DECISIONS.contains(request.getDecision())) {
            throw new BadRequestException("Review decision must be one of " + REVIEW_DECISIONS);
        }
        Candidate candidate = findActiveOrThrow(id);
        if (!"APPLIED".equals(candidate.getStage())) {
            throw new BadRequestException("Only an APPLIED candidate can be reviewed - this candidate is already " + candidate.getStage() + ".");
        }

        applyDecision(candidate, request.getDecision(), request.getRating(), request.getRemarks(), request.getRejectionReason());

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "REVIEW",
                "'" + saved.getFullName() + "' reviewed -> " + request.getDecision()
                        + (request.getRating() != null ? " (rating " + request.getRating() + "/5)" : ""));
        return CandidateDTO.from(saved);
    }

    /** Round-by-round pipeline advancement (or hold/reject) once past the initial review. */
    @Transactional
    public CandidateDTO advance(Long id, CandidateDTO.AdvanceStageRequest request) {
        Candidate candidate = findActiveOrThrow(id);
        String from = candidate.getStage();
        String to = request.getTargetStage();

        if (!VALID_STAGES.contains(to)) {
            throw new BadRequestException("Unknown stage: " + to);
        }
        if (TERMINAL_STAGES.contains(from)) {
            throw new BadRequestException("Candidate is already " + from + " - no further pipeline changes are possible.");
        }
        boolean isRejection = "REJECTED".equals(to);
        boolean isAllowedAdvance = ALLOWED_ADVANCES.getOrDefault(from, Set.of()).contains(to);
        if (!isRejection && !isAllowedAdvance) {
            throw new BadRequestException("Can't move a candidate from " + from + " to " + to + ".");
        }

        applyDecision(candidate, to, null, request.getRemarks(), request.getRejectionReason());

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "STAGE_CHANGE",
                "'" + saved.getFullName() + "': " + from + " -> " + to);
        return CandidateDTO.from(saved);
    }

    /**
     * "Select for Manager Round": HR assigns a hiring manager, schedules
     * the round 2 interview (date/time/Google Meet link), advances the
     * candidate's stage, and emails both the manager and the candidate -
     * all as one atomic action, per the Manager Interview Assignment
     * workflow. Requires the candidate to have just finished the HR round
     * (ROUND1), same as any other ROUND1 -> ROUND2 advance.
     */
    @Transactional
    public CandidateDTO assignManagerRound(Long id, CandidateDTO.AssignManagerRequest request) {
        Candidate candidate = findActiveOrThrow(id);
        if (!"ROUND1".equals(candidate.getStage())) {
            throw new BadRequestException("Only a candidate currently in the HR interview round (ROUND1) can be selected for the manager round - this candidate is " + candidate.getStage() + ".");
        }

        Employee manager = employeeRepository.findById(request.getManagerEmployeeId())
                .orElseThrow(() -> new BadRequestException("Unknown hiring manager: " + request.getManagerEmployeeId()));

        Interview interview = new Interview();
        interview.setCandidate(candidate);
        interview.setInterviewer(manager);
        interview.setRoundNumber(2);
        interview.setRoundType("HIRING_MANAGER");
        interview.setScheduledAt(request.getScheduledAt());
        interview.setMode("VIDEO");
        interview.setStatus("SCHEDULED");
        interview.setMeetingLink(request.getMeetingLink());
        interview.setInstructions(request.getInstructions());
        Interview savedInterview = interviewRepository.save(interview);

        candidate.setStage("ROUND2");
        Candidate savedCandidate = candidateRepository.save(candidate);

        auditLogService.log("Candidate", savedCandidate.getId(), "MANAGER_ROUND_ASSIGNED",
                "'" + savedCandidate.getFullName() + "' assigned to manager round with '" + manager.getFullName()
                        + "' at " + request.getScheduledAt());

        emailService.sendManagerAssignmentEmail(savedCandidate, savedInterview, manager);
        emailService.sendCandidateManagerRoundEmail(savedCandidate, savedInterview, manager);

        return CandidateDTO.from(savedCandidate);
    }

    /** After Round 3 clears, HR generates the offer. */
    @Transactional
    public CandidateDTO generateOffer(Long id, CandidateDTO.OfferRequest request) {
        Candidate candidate = findActiveOrThrow(id);
        if (!"ROUND3".equals(candidate.getStage())) {
            throw new BadRequestException("An offer can only be generated after the candidate has cleared Round 3 (Final/Management Interview).");
        }

        candidate.setOfferAmount(request.getOfferAmount());
        candidate.setExpectedJoiningDate(request.getExpectedJoiningDate());
        candidate.setOfferGeneratedAt(LocalDateTime.now());
        candidate.setStage("OFFERED");

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "OFFER_GENERATED",
                "Offer generated for '" + saved.getFullName() + "': " + request.getOfferAmount()
                        + ", joining " + request.getExpectedJoiningDate());

        emailService.sendOfferEmail(saved);

        return CandidateDTO.from(saved);
    }

    /**
     * Candidate accepts the offer (recorded by HR - this app has no
     * candidate-facing login/portal). Automatically creates the employee
     * profile and starts onboarding, reusing the same EmployeeService the
     * Employees module itself uses - so the resulting record is a normal
     * employee in every other respect (appears in the directory, gets an
     * employee code, etc.), not a special "recruited" record type.
     */
    @Transactional
    public CandidateDTO acceptOffer(Long id) {
        Candidate candidate = findActiveOrThrow(id);
        if (!"OFFERED".equals(candidate.getStage())) {
            throw new BadRequestException("This candidate doesn't have an active offer to accept.");
        }

        CreateEmployeeRequest employeeRequest = new CreateEmployeeRequest();
        employeeRequest.setFirstName(candidate.getFirstName());
        employeeRequest.setLastName(candidate.getLastName());
        employeeRequest.setEmail(candidate.getEmail());
        employeeRequest.setPhone(candidate.getPhone());
        employeeRequest.setDateOfJoining(candidate.getExpectedJoiningDate() != null
                ? candidate.getExpectedJoiningDate() : LocalDate.now());
        employeeRequest.setEmploymentType(candidate.getJobOpening().getEmploymentType());
        if (candidate.getJobOpening().getDepartment() != null) {
            employeeRequest.setDepartmentId(candidate.getJobOpening().getDepartment().getId());
        }
        if (candidate.getJobOpening().getDesignation() != null) {
            employeeRequest.setDesignationId(candidate.getJobOpening().getDesignation().getId());
        }
        // Reporting manager defaults to whoever ran this candidate's manager-round
        // interview (round 2, HIRING_MANAGER) - the same person who'll actually
        // manage them day to day, so this is the sensible default rather than
        // leaving it unset for HR to fill in manually after the fact.
        findManagerRoundInterviewer(candidate).ifPresent(m -> employeeRequest.setReportingManagerId(m.getId()));

        EmployeeDetailDTO createdEmployee = employeeService.create(employeeRequest);
        createEmployeeLogin(createdEmployee);

        candidate.setOfferAcceptedAt(LocalDateTime.now());
        candidate.setCreatedEmployeeId(createdEmployee.getId());
        candidate.setStage("HIRED");

        Candidate saved = candidateRepository.save(candidate);
        auditLogService.log("Candidate", saved.getId(), "OFFER_ACCEPTED",
                "'" + saved.getFullName() + "' accepted the offer - onboarded as employee " + createdEmployee.getEmployeeCode());
        return CandidateDTO.from(saved);
    }

    private java.util.Optional<Employee> findManagerRoundInterviewer(Candidate candidate) {
        return interviewRepository.findAllByCandidateIdAndDeletedFalseOrderByScheduledAtDesc(candidate.getId()).stream()
                .filter(i -> i.getRoundNumber() == 2 && i.getInterviewer() != null)
                .findFirst()
                .map(Interview::getInterviewer);
    }

    /**
     * Completes "Create Employee Login" from the auto-onboarding
     * requirements: a real HaodaOne User account, EMPLOYEE role, linked
     * to the new Employee record, with credentials emailed to them.
     * Failure here is logged, not thrown - the employee record itself is
     * already committed by this point, and HR can always create the
     * login manually from Users & Roles if this step has a problem
     * (duplicate username/email, email delivery down, etc).
     */
    private void createEmployeeLogin(EmployeeDetailDTO employee) {
        try {
            String username = uniqueUsernameFor(employee.getEmployeeCode());
            String temporaryPassword = generateTemporaryPassword();

            CreateUserRequest userRequest = new CreateUserRequest();
            userRequest.setUsername(username);
            userRequest.setEmail(employee.getEmail());
            userRequest.setFullName(employee.getFullName());
            userRequest.setTemporaryPassword(temporaryPassword);
            userRequest.setRoleNames(Set.of("EMPLOYEE"));

            UserDTO createdUser = userService.create(userRequest);
            User user = userRepository.findById(createdUser.getId())
                    .orElseThrow(() -> new IllegalStateException("Just-created user vanished: " + createdUser.getId()));
            employeeService.linkUserAccount(employee.getId(), user.getId());

            emailService.sendEmployeeWelcomeEmail(employee.getEmail(), employee.getFullName(),
                    employee.getEmployeeCode(), username, temporaryPassword);
        } catch (Exception e) {
            // See javadoc above - intentionally swallowed so a login-creation
            // hiccup can't undo the employee record this method already saved.
            auditLogService.log("Employee", employee.getId(), "LOGIN_CREATE_FAILED",
                    "Auto-creating a login for '" + employee.getFullName() + "' failed: " + e.getMessage());
        }
    }

    private String uniqueUsernameFor(String employeeCode) {
        String base = employeeCode.toLowerCase();
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + (++suffix);
        }
        return candidate;
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(TEMP_PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    private void applyDecision(Candidate candidate, String newStage, Integer rating, String remarks, String rejectionReason) {
        candidate.setStage(newStage);
        if (rating != null) {
            candidate.setRating(rating);
        }
        if (remarks != null) {
            candidate.setRemarks(remarks);
        }
        if ("REJECTED".equals(newStage)) {
            candidate.setRejectionReason(rejectionReason); // optional, per the workflow spec
        }
    }

    private Candidate findActiveOrThrow(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found: " + id));
        if (candidate.isDeleted()) {
            throw new ResourceNotFoundException("Candidate not found: " + id);
        }
        return candidate;
    }
}
