package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Risk Evaluation Response DTO
 * Contains risk score and session information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskEvaluationResponse {

    private Long userId;
    private String username;
    private int activeSessions;
    private int allowedSessions;
    private double riskScore;
    private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL
    private boolean thresholdExceeded;
    private String action; // NONE, SESSIONS_INVALIDATED
    private String message;
}
