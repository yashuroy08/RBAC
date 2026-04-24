package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * User Response DTO
 * Used to return user data without sensitive information.
 * 
 * The `publicId` (UUID) is the externally-visible identity.
 * The `id` (Long) remains available for admin-internal operations
 * (assign-location, lock, etc.) but should eventually migrate to publicId.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String publicId;       // UUID — externally safe identifier
    private String username;
    private String email;
    private Set<String> roles;
    private boolean accountNonExpired;
    private boolean accountNonLocked;
    private boolean credentialsNonExpired;
    private boolean enabled;
    private boolean mfaEnabled;    // true when adaptive MFA system covers this user
    private Long assignedLocationId;
    private String assignedLocationName;
    private boolean locationExempt;    // true = user bypasses all location checks
    private LocalDateTime createdAt;
}
