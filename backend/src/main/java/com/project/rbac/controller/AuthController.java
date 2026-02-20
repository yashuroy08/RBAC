package com.project.rbac.controller;

import com.project.rbac.dto.ApiResponse;
import com.project.rbac.dto.LoginRequest;
import com.project.rbac.dto.RegistrationRequest;
import com.project.rbac.dto.UserResponse;
import com.project.rbac.security.UserPrincipal;
import com.project.rbac.service.AuthService;
import com.project.rbac.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
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

            UserPrincipal userPrincipal = authService.authenticateUser(loginRequest, request);

            // Get session ID
            String sessionId = request.getSession().getId();

            log.info("Login successful for user: {}, Session ID: {}",
                    userPrincipal.getUsername(), sessionId);

            return ResponseEntity.ok(ApiResponse.success(
                    "Login successful",
                    new LoginResponse(
                            userPrincipal.getId(),
                            userPrincipal.getUsername(),
                            userPrincipal.getEmail(),
                            sessionId,
                            userPrincipal.getAuthorities().toString())));

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
     * Inner class for login response
     */
    private static class LoginResponse {
        public Long id;
        public String username;
        public String email;
        public String sessionId;
        public String roles;

        public LoginResponse(Long id, String username, String email, String sessionId, String roles) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.sessionId = sessionId;
            this.roles = roles;
        }
    }
}
