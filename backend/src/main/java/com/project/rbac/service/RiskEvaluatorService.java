package com.project.rbac.service;

import com.project.rbac.dto.RiskEvaluationResponse;
import com.project.rbac.dto.SessionInfoDTO;
import com.project.rbac.entity.RiskEvent;
import com.project.rbac.entity.User;
import com.project.rbac.entity.UserSession;
import com.project.rbac.repository.RiskEventRepository;
import com.project.rbac.repository.UserRepository;
import com.project.rbac.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * RISK EVALUATOR SERVICE
 * 
 * Core service implementing the Risk Evaluation Mechanism
 * 
 * Functionality:
 * 1. Tracks active sessions per user
 * 2. Calculates risk score based on concurrent sessions
 * 3. Automatically invalidates all sessions when threshold is exceeded
 * 4. Logs all risk events
 * 
 * Risk Score Formula:
 * Risk Score = (Active Sessions / Allowed Sessions) × 100
 * 
 * If Risk Score > 70%, all user sessions are invalidated
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskEvaluatorService {

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;
    private final RiskEventRepository riskEventRepository;
    private final SessionInvalidationService sessionInvalidationService;

    @Value("${risk.evaluator.max-sessions:2}")
    private int maxAllowedSessions;

    @Value("${risk.evaluator.risk-threshold:70.0}")
    private double riskThreshold;

    /**
     * Register a new user session
     * Called after successful login
     * 
     * @param userId    User ID
     * @param sessionId Spring Session ID
     * @param deviceId  Device identifier
     * @param ipAddress User IP address
     */
    @Transactional
    public void registerSession(Long userId, String sessionId, String deviceId, String ipAddress) {
        log.info("📢 New login attempt for User ID: {}. Session: {}", userId, sessionId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Create new session record
        UserSession userSession = new UserSession();
        userSession.setUser(user);
        userSession.setSessionId(sessionId);
        userSession.setDeviceId(deviceId);
        userSession.setIpAddress(ipAddress);
        userSession.setLoginTime(LocalDateTime.now());
        userSession.setActive(true);

        userSessionRepository.saveAndFlush(userSession);

        int countAfterSave = userSessionRepository.countActiveSessionsByUserId(userId);
        log.info("✅ Session registered for {}. Total active sessions now in DB: {}", user.getUsername(),
                countAfterSave);

        // Evaluate risk after registering new session, passing the current sessionId to
        // keep it alive
        evaluateRisk(userId, sessionId);
    }

    /**
     * CORE RISK EVALUATION LOGIC
     * 
     * @param userId           User ID to evaluate
     * @param currentSessionId The session ID to exclude from invalidation (if any)
     * @return RiskEvaluationResponse
     */
    @Transactional
    public RiskEvaluationResponse evaluateRisk(Long userId, String currentSessionId) {
        log.info("========================================");
        log.info("RISK EVALUATION STARTED for User ID: {}", userId);
        log.info("========================================");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // Get count of active sessions
        int activeSessions = userSessionRepository.countActiveSessionsByUserId(userId);

        // Calculate risk score as a percentage of capacity (purely for
        // display/visualization)
        // Formula: (activeSessions / maxAllowedSessions) * 100, capped at 100%
        double riskScore = calculateRiskScore(activeSessions, maxAllowedSessions);

        log.info("User: {}", user.getUsername());
        log.info("Active Sessions: {} / Max Allowed: {}", activeSessions, maxAllowedSessions);
        log.info("Risk Score (display): {}%", String.format("%.2f", riskScore));

        RiskEvaluationResponse response = new RiskEvaluationResponse();
        response.setUserId(userId);
        response.setUsername(user.getUsername());
        response.setActiveSessions(activeSessions);
        response.setAllowedSessions(maxAllowedSessions);
        response.setRiskScore(riskScore);
        response.setRiskLevel(determineRiskLevel(activeSessions, maxAllowedSessions));

        // ACTION TRIGGER: Only invalidate sessions when the number of active sessions
        // STRICTLY EXCEEDS the allowed maximum. The percentage threshold is used
        // purely for visualization — not for the enforcement decision.
        boolean limitExceeded = activeSessions > maxAllowedSessions;

        if (limitExceeded) {
            log.warn("🚨 SESSION LIMIT EXCEEDED! Active: {} > Max Allowed: {}", activeSessions, maxAllowedSessions);
            log.warn("Kicking out oldest sessions, keeping current session: {}", currentSessionId);

            // INVALIDATE OTHER SESSIONS (Keep the newest/current one)
            invalidateSessionsExcept(userId, currentSessionId);

            response.setThresholdExceeded(true);
            response.setAction("OTHER_SESSIONS_INVALIDATED");
            response.setMessage("Session limit exceeded. Other sessions have been invalidated for security.");

            // Log risk event
            logRiskEvent(user, activeSessions, riskScore, "OTHER_SESSIONS_INVALIDATED");
        } else {
            log.info("✅ Sessions are within limit ({}/{}). No action needed.", activeSessions, maxAllowedSessions);
            response.setThresholdExceeded(false);
            response.setAction("NONE");
            response.setMessage("Sessions are within acceptable limits.");
        }

        log.info("========================================");
        log.info("RISK EVALUATION COMPLETED");
        log.info("========================================\n");

        return response;
    }

    /**
     * Calculate risk score
     * Formula: (Active Sessions / Allowed Sessions) × 100
     * 
     * @param activeSessions  Number of active sessions
     * @param allowedSessions Number of allowed sessions
     * @return Risk score percentage
     */
    private double calculateRiskScore(int activeSessions, int allowedSessions) {
        if (allowedSessions == 0) {
            return 0.0;
        }
        // Cap at 100% for normal display; exceeding the limit shows as 100%+
        return ((double) activeSessions / allowedSessions) * 100.0;
    }

    /**
     * Determine risk level based on how many sessions are used vs. allowed.
     *
     * Levels:
     * LOW - Using 1-50% of capacity (e.g., 1-2 out of 4)
     * MEDIUM - Using 51-75% of capacity (e.g., 3 out of 4)
     * HIGH - Using 76-100% of capacity (e.g., 4 out of 4 — AT the limit)
     * CRITICAL - Exceeding the limit (e.g., 5+ out of 4)
     *
     * @param activeSessions  Number of currently active sessions
     * @param allowedSessions Maximum allowed sessions
     * @return Risk level string
     */
    private String determineRiskLevel(int activeSessions, int allowedSessions) {
        if (activeSessions > allowedSessions) {
            return "CRITICAL"; // Limit exceeded — enforcement triggered
        }
        double pct = (allowedSessions > 0) ? ((double) activeSessions / allowedSessions) * 100.0 : 0;
        if (pct <= 50) {
            return "LOW";
        } else if (pct <= 75) {
            return "MEDIUM";
        } else {
            return "HIGH"; // At or near the limit but not yet exceeded
        }
    }

    /**
     * INVALIDATE OTHER SESSIONS FOR A USER (KEEP CURRENT)
     * 
     * @param userId           User ID
     * @param excludeSessionId The current active session ID to keep
     */
    @Transactional
    public void invalidateSessionsExcept(Long userId, String excludeSessionId) {
        log.info("Invalidating all sessions except {} for user ID: {}", excludeSessionId, userId);

        // Get all active sessions
        List<UserSession> activeSessions = userSessionRepository.findActiveSessionsByUserId(userId);

        log.info("Found {} total active sessions", activeSessions.size());

        // Invalidate each session except the current one
        for (UserSession session : activeSessions) {
            if (session.getSessionId().equals(excludeSessionId)) {
                log.info("Staying active: current session {}", excludeSessionId);
                continue;
            }

            try {
                log.warn("Kicking out session: {} (Device: {}, IP: {})",
                        session.getSessionId(), session.getDeviceId(), session.getIpAddress());

                // 1. Invalidate HTTP session in Spring Session
                sessionInvalidationService.invalidateSession(session.getSessionId());

                // 2. Mark as inactive in our database
                session.setActive(false);
                userSessionRepository.saveAndFlush(session); // Use saveAndFlush to ensure immediate commit

                log.info("Successfully deactivated session {} in DB", session.getSessionId());
            } catch (Exception e) {
                log.error("Error invalidating session {}: {}", session.getSessionId(), e.getMessage());
            }
        }
    }

    /**
     * INVALIDATE ALL SESSIONS FOR A USER
     */
    @Transactional
    public void invalidateAllUserSessions(Long userId) {
        invalidateSessionsExcept(userId, null);
    }

    /**
     * Deactivate a specific session (called on logout)
     * 
     * @param sessionId Session ID to deactivate
     */
    @Transactional
    public void deactivateSession(String sessionId) {
        log.info("Deactivating session: {}", sessionId);

        userSessionRepository.findBySessionId(sessionId).ifPresent(session -> {
            session.setActive(false);
            userSessionRepository.save(session);
            log.info("Session deactivated: {}", sessionId);
        });
    }

    /**
     * Get all active sessions for a user
     * 
     * @param userId User ID
     * @return List of session info
     */
    @Transactional(readOnly = true)
    public List<SessionInfoDTO> getActiveSessionsForUser(Long userId) {
        return userSessionRepository.findActiveSessionsByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get risk evaluation for a user without triggering actions
     * 
     * @param userId User ID
     * @return Risk evaluation response
     */
    @Transactional(readOnly = true)
    public RiskEvaluationResponse getRiskEvaluation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int activeSessions = userSessionRepository.countActiveSessionsByUserId(userId);
        double riskScore = calculateRiskScore(activeSessions, maxAllowedSessions);

        log.info("Dashboard Refresh - User: {}, Active: {}/{}, Score: {}%",
                user.getUsername(), activeSessions, maxAllowedSessions, String.format("%.1f", riskScore));

        RiskEvaluationResponse response = new RiskEvaluationResponse();
        response.setUserId(userId);
        response.setUsername(user.getUsername());
        response.setActiveSessions(activeSessions);
        response.setAllowedSessions(maxAllowedSessions);
        response.setRiskScore(riskScore);
        response.setRiskLevel(determineRiskLevel(activeSessions, maxAllowedSessions));
        response.setThresholdExceeded(activeSessions > maxAllowedSessions);
        response.setAction("NONE");
        response.setMessage("Current risk evaluation (read-only)");

        return response;
    }

    /**
     * Log risk event to database
     * 
     * @param user           User entity
     * @param activeSessions Number of active sessions
     * @param riskScore      Calculated risk score
     * @param action         Action taken
     */
    private void logRiskEvent(User user, int activeSessions, double riskScore, String action) {
        RiskEvent event = new RiskEvent();
        event.setUserId(user.getId());
        event.setUsername(user.getUsername());
        event.setActiveSessions(activeSessions);
        event.setAllowedSessions(maxAllowedSessions);
        event.setRiskScore(riskScore);
        event.setActionTaken(action);
        event.setDescription(String.format(
                "Risk threshold reached. User had %d active sessions (allowed: %d). Risk score: %.2f%%. Action: %s.",
                activeSessions, maxAllowedSessions, riskScore, action));
        event.setEventTime(LocalDateTime.now());

        riskEventRepository.save(event);
        log.info("🔔 Risk event log persisted for {}: {}", user.getUsername(), action);
    }

    /**
     * Convert UserSession entity to DTO
     */
    private SessionInfoDTO convertToDTO(UserSession session) {
        SessionInfoDTO dto = new SessionInfoDTO();
        dto.setId(session.getId());
        dto.setSessionId(session.getSessionId());
        dto.setDeviceId(session.getDeviceId());
        dto.setIpAddress(session.getIpAddress());
        dto.setLoginTime(session.getLoginTime());
        dto.setLastAccessedTime(session.getLastAccessedTime());
        dto.setActive(session.isActive());
        return dto;
    }

    /**
     * Get recent risk events for a user
     * 
     * @param userId User ID
     * @param limit  Number of events to retrieve
     * @return List of risk events
     */
    @Transactional(readOnly = true)
    public List<RiskEvent> getRecentRiskEvents(Long userId, int limit) {
        return riskEventRepository.findRecentEventsByUserId(userId, limit);
    }
}
