package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * RiskEvent Entity - Logs risk evaluation events
 * Stores records when risk threshold is breached
 */
@Entity
@Table(name = "risk_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "active_sessions", nullable = false)
    private int activeSessions;

    @Column(name = "allowed_sessions", nullable = false)
    private int allowedSessions;

    @Column(name = "risk_score", nullable = false)
    private double riskScore;

    @Column(name = "action_taken", length = 50)
    private String actionTaken; // e.g., "ALL_SESSIONS_INVALIDATED"

    @Column(length = 500)
    private String description;

    @Column(name = "event_time", nullable = false)
    private LocalDateTime eventTime;

    @PrePersist
    protected void onCreate() {
        if (eventTime == null) {
            eventTime = LocalDateTime.now();
        }
    }
}
