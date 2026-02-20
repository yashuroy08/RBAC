package com.project.rbac.service;

import com.project.rbac.dto.LoginRequest;
import com.project.rbac.repository.UserRepository;
import com.project.rbac.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.Base64;
import java.util.UUID;

/**
 * Authentication Service
 * Handles login, logout, session management, and location-based access control
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RiskEvaluatorService riskEvaluatorService;
    private final LocationService locationService;

    /**
     * Authenticate user and create session.
     * Non-admin users are subject to location-based restriction.
     * Admin users can login from anywhere.
     *
     * @param loginRequest Login credentials with optional location data
     * @param request      HTTP request
     * @return Authenticated user principal
     * @throws RuntimeException if location validation fails for non-admin users
     */
    public UserPrincipal authenticateUser(LoginRequest loginRequest, HttpServletRequest request) {
        log.info("Authentication attempt for user: {}", loginRequest.getUsername());

        // Authenticate using Spring Security (validates username/password first)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // Check if user is admin - admins bypass location restriction
        boolean isAdmin = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // Non-admin: enforce location-based restriction
            if (locationService.isLocationRestrictionEnabled()) {
                boolean locationAllowed = locationService.isLocationAllowed(
                        loginRequest.getLatitude(),
                        loginRequest.getLongitude());

                if (!locationAllowed) {
                    log.warn("Login denied for user {} - outside allowed location zone. Lat: {}, Lng: {}",
                            loginRequest.getUsername(),
                            loginRequest.getLatitude(),
                            loginRequest.getLongitude());
                    throw new RuntimeException("LOGIN_LOCATION_DENIED");
                }

                log.info("Location validation passed for user: {}", loginRequest.getUsername());
            }
        } else {
            log.info("Admin user {} - location restriction bypassed", loginRequest.getUsername());
        }

        // Set authentication in security context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Get or create HTTP session
        HttpSession session = request.getSession(true);

        // Store security context in session
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext());

        log.info("User authenticated successfully: {}", userPrincipal.getUsername());

        // Register session in Risk Evaluator
        String sessionId = session.getId();
        String deviceId = generateDeviceId(request);
        String ipAddress = getClientIpAddress(request);

        riskEvaluatorService.registerSession(
                userPrincipal.getId(),
                sessionId,
                deviceId,
                ipAddress);

        return userPrincipal;
    }

    /**
     * Logout user and invalidate session
     *
     * @param request HTTP request
     */
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            String sessionId = session.getId();

            // Get current user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
                UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
                log.info("Logout initiated for user: {}", userPrincipal.getUsername());
            }

            // Deactivate session in risk evaluator
            riskEvaluatorService.deactivateSession(sessionId);

            // Invalidate HTTP session
            session.invalidate();

            // Clear security context
            SecurityContextHolder.clearContext();

            log.info("Session invalidated and user logged out");
        }
    }

    /**
     * Get currently authenticated user
     *
     * @return User principal or null
     */
    public UserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) authentication.getPrincipal();
        }

        return null;
    }

    /**
     * Generate device ID from request headers
     * Uses User-Agent as device identifier
     *
     * @param request HTTP request
     * @return Device ID
     */
    private String generateDeviceId(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && !userAgent.isEmpty()) {
            // Create a hash of User-Agent for device identification
            return Base64.getEncoder().encodeToString(userAgent.getBytes()).substring(0, 20);
        }
        return "UNKNOWN_DEVICE_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Get client IP address from request
     * Handles proxies and load balancers
     *
     * @param request HTTP request
     * @return IP address
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
