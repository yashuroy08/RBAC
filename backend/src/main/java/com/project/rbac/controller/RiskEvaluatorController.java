package com.project.rbac.controller;

import com.project.rbac.dto.ApiResponse;
import com.project.rbac.dto.RiskEvaluationResponse;
import com.project.rbac.dto.SessionInfoDTO;
import com.project.rbac.entity.RiskEvent;
import com.project.rbac.service.RiskEvaluatorService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Risk Evaluator Controller
 * 
 * Admin-only endpoints for:
 * - Risk evaluation
 * - Session monitoring
 * - Risk event logs
 */
@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
@Slf4j
@Api(tags = "Risk Evaluator APIs")
@PreAuthorize("hasRole('ADMIN')")
public class RiskEvaluatorController {

    private final RiskEvaluatorService riskEvaluatorService;

    /**
     * Evaluate risk for a specific user
     * 
     * GET /api/risk/evaluate/{userId}
     * 
     * Triggers risk evaluation and potential session invalidation
     * 
     * @param userId User ID
     * @return Risk evaluation response
     */
    @GetMapping("/evaluate/{userId}")
    @ApiOperation("Evaluate risk for user (triggers automatic actions)")
    public ResponseEntity<ApiResponse> evaluateUserRisk(@PathVariable Long userId) {
        try {
            log.info("Manual risk evaluation requested for user ID: {}", userId);

            RiskEvaluationResponse response = riskEvaluatorService.evaluateRisk(userId, null);

            return ResponseEntity.ok(ApiResponse.success(
                    "Risk evaluation completed",
                    response));
        } catch (Exception e) {
            log.error("Error evaluating risk: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get risk evaluation without triggering actions (read-only)
     * 
     * GET /api/risk/status/{userId}
     * 
     * @param userId User ID
     * @return Risk status
     */
    @GetMapping("/status/{userId}")
    @ApiOperation("Get current risk status (read-only)")
    public ResponseEntity<ApiResponse> getRiskStatus(@PathVariable Long userId) {
        try {
            RiskEvaluationResponse response = riskEvaluatorService.getRiskEvaluation(userId);

            return ResponseEntity.ok(ApiResponse.success(
                    "Risk status retrieved",
                    response));
        } catch (Exception e) {
            log.error("Error getting risk status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all active sessions for a user
     * 
     * GET /api/risk/sessions/{userId}
     * 
     * @param userId User ID
     * @return List of active sessions
     */
    @GetMapping("/sessions/{userId}")
    @ApiOperation("Get active sessions for user")
    public ResponseEntity<ApiResponse> getActiveSessions(@PathVariable Long userId) {
        try {
            List<SessionInfoDTO> sessions = riskEvaluatorService.getActiveSessionsForUser(userId);

            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Found %d active sessions", sessions.size()),
                    sessions));
        } catch (Exception e) {
            log.error("Error getting active sessions: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Manually invalidate all sessions for a user
     * 
     * POST /api/risk/invalidate/{userId}
     * 
     * @param userId User ID
     * @return Success message
     */
    @PostMapping("/invalidate/{userId}")
    @ApiOperation("Manually invalidate all sessions for user")
    public ResponseEntity<ApiResponse> invalidateAllSessions(@PathVariable Long userId) {
        try {
            log.warn("Manual session invalidation requested for user ID: {}", userId);

            riskEvaluatorService.invalidateAllUserSessions(userId);

            return ResponseEntity.ok(ApiResponse.success(
                    "All sessions invalidated successfully"));
        } catch (Exception e) {
            log.error("Error invalidating sessions: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get recent risk events for a user
     * 
     * GET /api/risk/events/{userId}
     * 
     * @param userId User ID
     * @param limit  Number of events (default: 10)
     * @return List of risk events
     */
    @GetMapping("/events/{userId}")
    @ApiOperation("Get recent risk events for user")
    public ResponseEntity<ApiResponse> getRiskEvents(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int limit) {

        try {
            List<RiskEvent> events = riskEvaluatorService.getRecentRiskEvents(userId, limit);

            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Retrieved %d risk events", events.size()),
                    events));
        } catch (Exception e) {
            log.error("Error getting risk events: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
