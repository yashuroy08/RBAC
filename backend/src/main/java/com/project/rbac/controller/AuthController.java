package com.project.rbac.controller;

import com.project.rbac.dto.*;
import com.project.rbac.security.UserPrincipal;
import com.project.rbac.service.AuthService;
import com.project.rbac.service.RiskEvaluatorService;
import com.project.rbac.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import javax.validation.Valid;

/**
 * Authentication Controller
 * 
 * Handles:
 * - User registration
 * - Login (session-based)
 * - Logout
 * - Current user information
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Api(tags = "Authentication APIs")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final RiskEvaluatorService riskEvaluatorService;

    /**
     * Register new user
     * 
     * POST /api/auth/register
     * 
     * @param request Registration request
     * @return ApiResponse with user data
     */
    @PostMapping("/register")
    @ApiOperation("Register a new user")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody RegistrationRequest request) {
        try {
            log.info("Registration request for username: {}", request.getUsername());

            UserResponse userResponse = userService.registerUser(request);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User registered successfully", userResponse));

        } catch (Exception e) {
            log.error("Registration error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Login user (creates session)
     * 
     * POST /api/auth/login
     * 
     * @param loginRequest Login credentials
     * @param request      HTTP request
     * @return ApiResponse with user data and session info
     */
    @PostMapping("/login")
    @ApiOperation("Login user and create session")
    public ResponseEntity<ApiResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {

        try {
            log.info("Login request for username: {}", loginRequest.getUsername());

            AuthService.AuthResult authResult = authService.authenticateUser(loginRequest, request);
            UserPrincipal userPrincipal = authResult.userPrincipal;
            com.project.rbac.dto.RiskEvaluationResponse riskResponse = authResult.riskResponse;

            // Get session ID
            String sessionId = request.getSession().getId();

            log.info("Login successful for user: {}, Session ID: {}",
                    userPrincipal.getUsername(), sessionId);

            String message = "Login successful";
            boolean mfaRequired = false;
            String mfaMessage = null;

            if (riskResponse != null) {
                if (riskResponse.isMfaRequired()) {
                    mfaRequired = true;
                    mfaMessage = riskResponse.getMfaMessage();
                    message = mfaMessage;
                } else if (riskResponse.isThresholdExceeded()) {
                    message = "Warning: Security limits exceeded. Other persons or previous sessions logged in the account have been logged out.";
                }
            }

            log.info("📢 Login status - MFA Required: {}, Message: {}", mfaRequired, message);

            return ResponseEntity.ok(ApiResponse.success(
                    message,
                    new LoginResponse(
                            userPrincipal.getId(),
                            userPrincipal.getUsername(),
                            userPrincipal.getEmail(),
                            sessionId,
                            userPrincipal.getAuthorities().toString(),
                            mfaRequired,
                            mfaMessage)));

        } catch (org.springframework.security.authentication.LockedException e) {
            log.warn("Login denied: Account locked for user: {}", loginRequest.getUsername());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Account is locked. Please contact support."));
        } catch (org.springframework.security.authentication.DisabledException e) {
            log.warn("Login denied: Account disabled for user: {}", loginRequest.getUsername());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Account is disabled. Please contact an administrator."));
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            log.warn("Login error: Bad credentials for user: {}", loginRequest.getUsername());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        } catch (RuntimeException e) {
            if ("LOGIN_LOCATION_DENIED".equals(e.getMessage())) {
                log.warn("Login denied due to location restriction for user: {}", loginRequest.getUsername());
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error(
                                "Access denied: You are outside the allowed login zone. Please login from the authorized location."));
            }
            log.error("Login error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid username or password"));
        }
    }

    /**
     * Logout user (invalidates session)
     * 
     * POST /api/auth/logout
     * 
     * @param request HTTP request
     * @return ApiResponse
     */
    @PostMapping("/logout")
    @ApiOperation("Logout user and invalidate session")
    public ResponseEntity<ApiResponse> logout(HttpServletRequest request) {
        try {
            authService.logout(request);
            return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
        } catch (Exception e) {
            log.error("Logout error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Logout failed"));
        }
    }

    /**
     * Get current authenticated user
     * 
     * GET /api/auth/me
     * 
     * @return ApiResponse with current user data
     */
    @GetMapping("/me")
    @ApiOperation("Get current authenticated user")
    public ResponseEntity<ApiResponse> getCurrentUser() {
        try {
            UserPrincipal userPrincipal = authService.getCurrentUser();

            if (userPrincipal == null) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Not authenticated"));
            }

            UserResponse userResponse = userService.getUserById(userPrincipal.getId());

            return ResponseEntity.ok(ApiResponse.success(
                    "Current user retrieved",
                    userResponse));

        } catch (Exception e) {
            log.error("Error getting current user: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving user data"));
        }
    }

    /**
     * Reset password (Prototype)
     * 
     * POST /api/auth/reset-password
     * 
     * @param request Password reset request
     * @return ApiResponse
     */
    @PostMapping("/reset-password")
    @ApiOperation("Reset user password (prototype)")
    public ResponseEntity<ApiResponse> resetPassword(
            @Valid @RequestBody com.project.rbac.dto.PasswordResetRequest request) {
        try {
            userService.resetPassword(request);
            return ResponseEntity
                    .ok(ApiResponse.success("Password reset successfully. You can now login with your new password."));
        } catch (Exception e) {
            log.error("Password reset error: {}", e.getMessage());
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     * 
     * GET /api/auth/health
     * 
     * @return Health status
     */
    @GetMapping("/health")
    @ApiOperation("Health check")
    public ResponseEntity<ApiResponse> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("Service is running"));
    }

    /**
     * Verify MFA OTP and trust device
     */
    @PostMapping("/verify-mfa")
    @ApiOperation("Verify MFA OTP and trust device")
    public ResponseEntity<ApiResponse> verifyMfa(
            @Valid @RequestBody MfaVerificationRequest verificationRequest,
            HttpServletRequest request) {
        try {
            // Can't use authService.getCurrentUser() because it blocks MFA_PENDING sessions
            Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
            }
            
            UserPrincipal currentUser = (UserPrincipal) authentication.getPrincipal();

            boolean verified = riskEvaluatorService.verifyMfaAndTrustDevice(
                    currentUser.getId(), 
                    verificationRequest.getSessionId(), 
                    verificationRequest.getOtp()
            );

            if (verified) {
                // IMPORTANT: Remove the MFA_PENDING flag to unlock the session
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.removeAttribute("MFA_PENDING");
                    log.info("🔓 Session {} unlocked - MFA verified for user {}", session.getId(), currentUser.getUsername());
                }
                
                return ResponseEntity.ok(ApiResponse.success("MFA verified and device trusted successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("Invalid OTP. Please try again."));
            }
        } catch (Exception e) {
            log.error("MFA verification error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("MFA verification failed"));
        }
    }

    /**
     * Get trusted devices for current user
     */
    @GetMapping("/trusted-devices")
    @ApiOperation("Get trusted devices for current user")
    public ResponseEntity<ApiResponse> getTrustedDevices() {
        try {
            UserPrincipal currentUser = authService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
            }

            // This would normally be in a separate DeviceService but since we're adding it to Auth
            // We'll use the repository directly or add a method to RiskEvaluator
            // For now, let's assume we can get them from a new method in RiskEvaluatorService
            return ResponseEntity.ok(ApiResponse.success(
                    "Trusted devices retrieved",
                    riskEvaluatorService.getTrustedDevicesForUser(currentUser.getId())
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to retrieve trusted devices"));
        }
    }

    /**
     * Revoke trust for a device
     */
    @DeleteMapping("/trusted-devices/{id}/revoke")
    @ApiOperation("Revoke trust for a device")
    public ResponseEntity<ApiResponse> revokeTrustedDevice(@PathVariable Long id) {
        try {
            UserPrincipal currentUser = authService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
            }

            boolean revoked = riskEvaluatorService.revokeTrustedDevice(currentUser.getId(), id);
            if (revoked) {
                return ResponseEntity.ok(ApiResponse.success("Device trust revoked successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Device not found or not owned by you"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("Failed to revoke device trust"));
        }
    }

    /**
     * Inner class for login response
     */
    private static class LoginResponse {
        public Long id;
        public String username;
        public String email;
        public String sessionId;
        public String roles;
        public boolean mfaRequired;
        public String mfaMessage;

        public LoginResponse(Long id, String username, String email, String sessionId, String roles, boolean mfaRequired, String mfaMessage) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.sessionId = sessionId;
            this.roles = roles;
            this.mfaRequired = mfaRequired;
            this.mfaMessage = mfaMessage;
        }
    }

    /**
     * Revoke trust for a device
     */
    @PostMapping("/revoke-device/{id}")
    @ApiOperation("Revoke trust for a specific device")
    public ResponseEntity<ApiResponse> revokeTrustedDevice(@PathVariable Long id) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
        }

        try {
            riskEvaluatorService.revokeDevice(currentUser.getId(), id);
            return ResponseEntity.ok(ApiResponse.success("Device trust revoked successfully. Associated sessions terminated."));
        } catch (Exception e) {
            log.error("Error revoking device {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }
}
