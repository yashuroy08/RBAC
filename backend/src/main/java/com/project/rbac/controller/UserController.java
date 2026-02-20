package com.project.rbac.controller;

import com.project.rbac.dto.ApiResponse;
import com.project.rbac.dto.RiskEvaluationResponse;
import com.project.rbac.dto.SessionInfoDTO;
import com.project.rbac.dto.UserResponse;
import com.project.rbac.entity.RiskEvent;
import com.project.rbac.security.UserPrincipal;
import com.project.rbac.service.RiskEvaluatorService;
import com.project.rbac.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User Management Controller
 * 
 * Handles:
 * - User profile operations
 * - User's own risk/session data (for Dashboard)
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
@Api(tags = "User Management APIs")
public class UserController {

    private final UserService userService;
    private final RiskEvaluatorService riskEvaluatorService;

    /**
     * Get user profile by ID
     * 
     * GET /api/user/{id}
     * 
     * @param id User ID
     * @return User data
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiOperation("Get user by ID")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(ApiResponse.success("User retrieved", user));
        } catch (Exception e) {
            log.error("Error getting user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get user by username
     * 
     * GET /api/user/username/{username}
     * 
     * @param username Username
     * @return User data
     */
    @GetMapping("/username/{username}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiOperation("Get user by username")
    public ResponseEntity<ApiResponse> getUserByUsername(@PathVariable String username) {
        try {
            UserResponse user = userService.getUserByUsername(username);
            return ResponseEntity.ok(ApiResponse.success("User retrieved", user));
        } catch (Exception e) {
            log.error("Error getting user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── User's Own Dashboard Data ────────────────────────────────

    /**
     * Get current user's risk status (for Dashboard)
     * 
     * GET /api/user/my-risk-status
     */
    @GetMapping("/my-risk-status")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiOperation("Get current user's risk status")
    public ResponseEntity<ApiResponse> getMyRiskStatus(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            RiskEvaluationResponse response = riskEvaluatorService.getRiskEvaluation(principal.getId());
            return ResponseEntity.ok(ApiResponse.success("Risk status retrieved", response));
        } catch (Exception e) {
            log.error("Error getting risk status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get current user's active sessions (for Dashboard)
     * 
     * GET /api/user/my-sessions
     */
    @GetMapping("/my-sessions")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiOperation("Get current user's active sessions")
    public ResponseEntity<ApiResponse> getMySessions(@AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<SessionInfoDTO> sessions = riskEvaluatorService.getActiveSessionsForUser(principal.getId());
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Found %d active sessions", sessions.size()), sessions));
        } catch (Exception e) {
            log.error("Error getting sessions: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get current user's risk events (for Dashboard)
     * 
     * GET /api/user/my-risk-events
     */
    @GetMapping("/my-risk-events")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @ApiOperation("Get current user's recent risk events")
    public ResponseEntity<ApiResponse> getMyRiskEvents(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<RiskEvent> events = riskEvaluatorService.getRecentRiskEvents(principal.getId(), limit);
            return ResponseEntity.ok(ApiResponse.success(
                    String.format("Retrieved %d risk events", events.size()), events));
        } catch (Exception e) {
            log.error("Error getting risk events: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
