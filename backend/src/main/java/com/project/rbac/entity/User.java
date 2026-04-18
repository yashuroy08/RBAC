package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * User Entity - Represents application users
 * Contains user credentials and role associations
 * 
 * Security note: The internal `id` (Long) is used for JPA relationships.
 * The `publicId` (UUID) is exposed in APIs to prevent IDOR vulnerabilities.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email", unique = true),
        @Index(name = "idx_user_username", columnList = "username", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "roles", "sessions", "assignedLocation" })
@EqualsAndHashCode(exclude = { "roles", "sessions", "assignedLocation" })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Universally Unique Identifier — exposed in all public APIs as the user's identity.
     * Auto-generated at entity creation. Never changes.
     */
    @Column(name = "public_id", length = 36)
    private String publicId;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password; // Stored as BCrypt hash

    @Column(name = "account_non_expired")
    private boolean accountNonExpired = true;

    @Column(name = "account_non_locked")
    private boolean accountNonLocked = true;

    @Column(name = "credentials_non_expired")
    private boolean credentialsNonExpired = true;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Many-to-Many relationship with Role
     * A user can have multiple roles
     */
    @ManyToMany(fetch = FetchType.EAGER, cascade = { CascadeType.MERGE, CascadeType.PERSIST })
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"), inverseJoinColumns = @JoinColumn(name = "role_id", referencedColumnName = "id"))
    private Set<Role> roles = new HashSet<>();

    /**
     * One-to-Many relationship with UserSession
     * Track all active sessions for this user
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserSession> sessions = new HashSet<>();

    /**
     * Optional assigned location restriction for this user.
     * If null, the global/active location config is used.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_location_id")
    private LocationConfig assignedLocation;

    @PrePersist
    protected void onCreate() {
        if (publicId == null || publicId.isBlank()) {
            publicId = UUID.randomUUID().toString();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Helper method to add role to user
     */
    public void addRole(Role role) {
        this.roles.add(role);
        role.getUsers().add(this);
    }

    /**
     * Helper method to remove role from user
     */
    public void removeRole(Role role) {
        this.roles.remove(role);
        role.getUsers().remove(this);
    }
}
