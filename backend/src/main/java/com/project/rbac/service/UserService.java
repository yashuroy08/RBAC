package com.project.rbac.service;

import com.project.rbac.dto.PasswordResetRequest;
import com.project.rbac.dto.RegistrationRequest;
import com.project.rbac.dto.UserResponse;
import com.project.rbac.entity.Role;
import com.project.rbac.entity.RoleName;
import com.project.rbac.entity.User;
import com.project.rbac.repository.RoleRepository;
import com.project.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * User Service
 * Handles user management operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.project.rbac.repository.LocationConfigRepository locationConfigRepository;
    private final com.project.rbac.repository.TrustedDeviceRepository trustedDeviceRepository;
    private final com.project.rbac.repository.RiskEventRepository riskEventRepository;
    private final com.project.rbac.repository.UserSessionRepository userSessionRepository;

    /**
     * Register a new user
     * 
     * @param request Registration request
     * @return Created user response
     */
    @Transactional
    public UserResponse registerUser(RegistrationRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());

        // Hash password using BCrypt
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Set default values
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);

        // Assign default USER role
        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Default USER role not found"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        // Save user
        User savedUser = userRepository.save(user);

        log.info("User registered successfully: {}", savedUser.getUsername());

        return convertToUserResponse(savedUser);
    }

    /**
     * Get user by ID
     * 
     * @param userId User ID
     * @return User response
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return convertToUserResponse(user);
    }

    /**
     * Get user by username
     * 
     * @param username Username
     * @return User response
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return convertToUserResponse(user);
    }

    /**
     * Get all users
     * 
     * @return List of user responses
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * Assign ADMIN role to user (Admin operation)
     * 
     * @param userId User ID
     * @return Updated user response
     */
    @Transactional
    public UserResponse assignAdminRole(Long userId) {
        log.info("Assigning ADMIN role to user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

        user.getRoles().add(adminRole);
        User updatedUser = userRepository.save(user);

        log.info("ADMIN role assigned to user: {}", user.getUsername());

        return convertToUserResponse(updatedUser);
    }

    /**
     * Remove ADMIN role from user (Admin operation)
     * 
     * @param userId User ID
     * @return Updated user response
     */
    @Transactional
    public UserResponse removeAdminRole(Long userId) {
        log.info("Removing ADMIN role from user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getRoles().removeIf(role -> role.getName() == RoleName.ROLE_ADMIN);
        User updatedUser = userRepository.save(user);

        log.info("ADMIN role removed from user: {}", user.getUsername());

        return convertToUserResponse(updatedUser);
    }

    /**
     * Lock user account (Admin operation)
     * 
     * @param userId User ID
     */
    @Transactional
    public void lockUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountNonLocked(false);
        userRepository.save(user);

        log.info("User account locked: {}", user.getUsername());
    }

    /**
     * Unlock user account (Admin operation)
     * 
     * @param userId User ID
     */
    @Transactional
    public void unlockUserAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountNonLocked(true);
        userRepository.save(user);

        log.info("User account unlocked: {}", user.getUsername());
    }

    /**
     * Reset user password (Prototype version - no OTP)
     * 
     * @param request Password reset request (email + new password)
     */
    @Transactional
    public void resetPassword(PasswordResetRequest request) {
        log.info("Password reset requested for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found with email: " + request.getEmail()));

        // Hash and set new password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password reset successful for user: {}", user.getUsername());
    }

    /**
     * Convert User entity to UserResponse DTO
     * 
     * @param user User entity
     * @return UserResponse DTO
     */
    private UserResponse convertToUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toSet());

        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setPublicId(user.getPublicId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRoles(roleNames);
        response.setAccountNonExpired(user.isAccountNonExpired());
        response.setAccountNonLocked(user.isAccountNonLocked());
        response.setCredentialsNonExpired(user.isCredentialsNonExpired());
        response.setEnabled(user.isEnabled());
        response.setMfaEnabled(true); // Adaptive MFA is system-wide
        response.setCreatedAt(user.getCreatedAt());

        if (user.getAssignedLocation() != null) {
            response.setAssignedLocationId(user.getAssignedLocation().getId());
            response.setAssignedLocationName(user.getAssignedLocation().getLocationName());
        }

        response.setLocationExempt(user.isLocationExempt());

        return response;
    }

    /**
     * Assign a specific location config to a user
     */
    @Transactional
    public UserResponse assignLocationToUser(Long userId, Long locationConfigId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.project.rbac.entity.LocationConfig location = locationConfigRepository.findById(locationConfigId)
                .orElseThrow(() -> new RuntimeException("Location configuration not found"));

        user.setAssignedLocation(location);
        user.setLocationExempt(false); // Actively restricted now
        User saved = userRepository.save(user);

        // SECURITY: Invalidate all active sessions for this user.
        // They must re-login so the new location restriction is enforced.
        int activeSessions = userSessionRepository.countActiveSessionsByUserId(userId);
        if (activeSessions > 0) {
            userSessionRepository.deactivateAllSessionsByUserId(userId);
            log.warn("Invalidated {} active session(s) for user '{}' due to location policy change → '{}'",
                    activeSessions, user.getUsername(), location.getLocationName());
        }

        log.info("Assigned location '{}' to user '{}' (locationExempt=false)", location.getLocationName(), user.getUsername());

        return convertToUserResponse(saved);
    }

    /**
     * Remove assigned location from a user (fall back to global)
     */
    @Transactional
    public UserResponse removeLocationFromUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAssignedLocation(null);
        user.setLocationExempt(true); // Revert to global access (no restriction)
        User saved = userRepository.save(user);

        log.info("Removed assigned location from user '{}' (locationExempt=true)", user.getUsername());

        return convertToUserResponse(saved);
    }
    /**
     * Delete a user account (Admin operation)
     * 
     * Performs cascading cleanup:
     *  1. Invalidate all active sessions
     *  2. Remove all trusted devices
     *  3. Remove all risk event logs
     *  4. Detach role associations
     *  5. Delete the user entity
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String username = user.getUsername();

        // 1. Clean up sessions (handled by cascade, but explicit for safety)
        userSessionRepository.deactivateAllSessionsByUserId(userId);
        userSessionRepository.deleteAll(userSessionRepository.findByUserId(userId));

        // 2. Clean up trusted devices
        trustedDeviceRepository.deleteAll(trustedDeviceRepository.findByUserId(userId));

        // 3. Clean up risk event audit trail
        riskEventRepository.deleteByUserId(userId);

        // 4. Detach roles (ManyToMany)
        user.getRoles().clear();

        // 5. Delete user entity
        userRepository.delete(user);

        log.warn("⚠️ Permanently deleted user '{}' (ID: {}). All associated data purged.", username, userId);
    }
}
