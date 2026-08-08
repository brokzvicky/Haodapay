package com.haodaone.user.service;

import com.haodaone.audit.service.AuditLogService;
import com.haodaone.common.exception.BadRequestException;
import com.haodaone.common.exception.ResourceNotFoundException;
import com.haodaone.user.dto.CreateUserRequest;
import com.haodaone.user.dto.UserDTO;
import com.haodaone.user.entity.Role;
import com.haodaone.user.entity.User;
import com.haodaone.user.repository.RoleRepository;
import com.haodaone.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserService(UserRepository userRepository, RoleRepository roleRepository,
                        PasswordEncoder passwordEncoder, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    public List<UserDTO> listAll() {
        return userRepository.findAllByDeletedFalse().stream().map(UserDTO::from).toList();
    }

    public UserDTO getById(Long id) {
        return UserDTO.from(findActiveOrThrow(id));
    }

    @Transactional
    public UserDTO create(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email '" + request.getEmail() + "' is already registered");
        }

        Set<String> requestedRoleNames = request.getRoleNames().isEmpty() ? Set.of("EMPLOYEE") : request.getRoleNames();
        Set<Role> roles = new HashSet<>();
        for (String roleName : requestedRoleNames) {
            roles.add(roleRepository.findByName(roleName)
                    .orElseThrow(() -> new BadRequestException("Unknown role: " + roleName)));
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getTemporaryPassword()));
        user.setMustChangePassword(true);
        user.setActive(true);
        user.setRoles(roles);

        User saved = userRepository.save(user);
        auditLogService.log("User", saved.getId(), "CREATE", "Created user '" + saved.getUsername() + "' with roles " + requestedRoleNames);
        return UserDTO.from(saved);
    }

    @Transactional
    public UserDTO setActive(Long id, boolean active) {
        User user = findActiveOrThrow(id);
        boolean wasActive = user.isActive();
        user.setActive(active);
        User saved = userRepository.save(user);
        if (wasActive != active) {
            auditLogService.log("User", saved.getId(), active ? "ACTIVATE" : "DEACTIVATE",
                    "active: " + wasActive + " -> " + active);
        }
        return UserDTO.from(saved);
    }

    @Transactional
    public UserDTO assignRoles(Long id, Set<String> roleNames) {
        User user = findActiveOrThrow(id);
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            roles.add(roleRepository.findByName(roleName)
                    .orElseThrow(() -> new BadRequestException("Unknown role: " + roleName)));
        }
        user.setRoles(roles);
        User saved = userRepository.save(user);
        auditLogService.log("User", saved.getId(), "UPDATE", "Roles set to " + roleNames);
        return UserDTO.from(saved);
    }

    private User findActiveOrThrow(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        if (user.isDeleted()) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        return user;
    }
}
