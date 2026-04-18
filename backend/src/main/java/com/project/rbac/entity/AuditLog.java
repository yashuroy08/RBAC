package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * AuditLog Entity — Industry-grade immutable audit trail.
 *
 * Every security-relevant action in the system is logged here:
 * - Authentication events (login, logout, failed attempts)
 * - Administrative actions (role changes, account locks, user deletions)
 * - Risk engine events (session invalidations, MFA challenges)
 * - Configuration changes (geofence updates, policy changes)
 *
 * This table is APPEND-ONLY. Records are never updated or deleted
 * to maintain forensic integrity for compliance (SOC 2, ISO 27001).
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_actor", columnList = "actor_username"),
    @Index(name = "idx_audit_target", columnList = "target_username"),
    @Index(name = "idx_audit_category", columnList = "category"),
    @Index(name = "idx_audit_severity", columnList = "severity"),
    @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Category of the event for filtering.
     * AUTH, ADMIN, RISK, CONFIG, SYSTEM
     */
    @Column(nullable = false, length = 30)
    private String category;

    /**
     * Specific action that occurred.
     * e.g., LOGIN_SUCCESS, LOGIN_FAILED, USER_DELETED, ROLE_ELEVATED,
     * SESSION_INVALIDATED, MFA_CHALLENGED, GEOFENCE_ASSIGNED, etc.
     */
    @Column(nullable = false, length = 80)
    private String action;

    /**
     * Severity level for prioritization.
     * INFO, WARNING, CRITICAL
     */
    @Column(nullable = false, length = 15)
    private String severity;

    /**
     * Who performed the action (username or "SYSTEM" for automated actions).
     */
    @Column(name = "actor_username", nullable = false, length = 100)
    private String actorUsername;

    /**
     * Who was affected by the action (may be the same as actor for self-actions).
     * Nullable for system-wide events.
     */
    @Column(name = "target_username", length = 100)
    private String targetUsername;

    /**
     * Human-readable description of what happened.
     */
    @Column(nullable = false, length = 1000)
    private String description;

    /**
     * IP address of the actor at the time of the event.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * Device/User-Agent identifier.
     */
    @Column(name = "device_info", length = 300)
    private String deviceInfo;

    /**
     * Session ID associated with the event (if applicable).
     */
    @Column(name = "session_id", length = 128)
    private String sessionId;

    /**
     * Optional metadata — JSON blob for extensibility.
     * e.g., {"oldRole": "USER", "newRole": "ADMIN"}
     */
    @Column(name = "metadata", length = 2000)
    private String metadata;

    /**
     * Outcome of the action: SUCCESS, FAILURE, DENIED
     */
    @Column(nullable = false, length = 15)
    private String outcome;

    /**
     * Immutable timestamp — set once on creation, never modified.
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
