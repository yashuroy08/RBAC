package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * UserSession Entity - Tracks active user sessions
 * Used by Risk Evaluator to monitor concurrent sessions
 */
@Entity
@Table(name = "user_sessions", indexes = {
        @Index(name = "idx_user_id", columnList = "user_id"),
        @Index(name = "idx_session_id", columnList = "session_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Many-to-One relationship with User
     * Links session to specific user
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "session_id", nullable = false, unique = true, length = 100)
    private String sessionId; // Spring Session ID

    @Column(name = "device_id", length = 255)
    private String deviceId; // Device identifier (e.g., User-Agent hash)

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "login_time", nullable = false)
    private LocalDateTime loginTime;

    @Column(name = "last_accessed_time")
    private LocalDateTime lastAccessedTime;

    @Column(name = "is_active")
    private boolean active = true;

    @PrePersist
    protected void onCreate() {
        if (loginTime == null) {
            loginTime = LocalDateTime.now();
        }
        lastAccessedTime = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastAccessedTime = LocalDateTime.now();
    }
}
