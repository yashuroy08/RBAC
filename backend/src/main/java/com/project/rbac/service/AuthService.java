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
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import com.project.rbac.dto.RiskEvaluationResponse;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
    public AuthResult authenticateUser(LoginRequest loginRequest, HttpServletRequest request) {
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
                        loginRequest.getLongitude(),
                        userPrincipal.getId());

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
        String deviceName = getDeviceName(request);
        String ipAddress = getClientIpAddress(request);

        com.project.rbac.dto.RiskEvaluationResponse riskResponse = riskEvaluatorService.registerSession(
                userPrincipal.getId(),
                sessionId,
                deviceId,
                deviceName,
                ipAddress);

        // If MFA is required, flag the session as pending MFA
        if (riskResponse != null && riskResponse.isMfaRequired()) {
            session.setAttribute("MFA_PENDING", true);
            log.info("🔒 Session {} flagged as MFA_PENDING", sessionId);
        } else {
            session.removeAttribute("MFA_PENDING");
        }

        return new AuthResult(userPrincipal, riskResponse, authentication);
    }
    
    public static class AuthResult {
        public final UserPrincipal userPrincipal;
        public final com.project.rbac.dto.RiskEvaluationResponse riskResponse;
        public final Authentication authentication;
        
        public AuthResult(UserPrincipal userPrincipal, com.project.rbac.dto.RiskEvaluationResponse riskResponse, Authentication authentication) {
            this.userPrincipal = userPrincipal;
            this.riskResponse = riskResponse;
            this.authentication = authentication;
        }
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
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            
            // CRITICAL: Check if this session is pending MFA verification
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpSession session = attr.getRequest().getSession(false);
            
            if (session != null && Boolean.TRUE.equals(session.getAttribute("MFA_PENDING"))) {
                log.warn("Attempt to access current user during MFA_PENDING state for user: {}", principal.getUsername());
                return null;
            }
            
            return principal;
        }

        return null;
    }

    /**
     * Parse human-readable device name from User-Agent
     */
    private String getDeviceName(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        if (ua == null || ua.isEmpty()) return "Unknown Device";

        String browser = "Unknown Browser";
        String os = "Unknown OS";

        // Simple Browser Detection
        if (ua.contains("Edg")) browser = "Edge";
        else if (ua.contains("Chrome")) browser = "Chrome";
        else if (ua.contains("Safari")) browser = "Safari";
        else if (ua.contains("Firefox")) browser = "Firefox";
        else if (ua.contains("MSIE") || ua.contains("Trident")) browser = "IE";

        // Simple OS Detection
        if (ua.contains("Windows")) os = "Windows";
        else if (ua.contains("Android")) os = "Android";
        else if (ua.contains("iPhone") || ua.contains("iPad")) os = "iOS";
        else if (ua.contains("Macintosh")) os = "macOS";
        else if (ua.contains("Linux")) os = "Linux";

        return browser + " on " + os;
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
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(userAgent.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hash) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                String id = hexString.toString().substring(0, 32);
                log.info("🖥️ Generated Device ID: {} from User-Agent", id);
                return id;
            } catch (Exception e) {
                String id = Base64.getEncoder().encodeToString(userAgent.getBytes()).substring(0, Math.min(userAgent.length(), 20));
                log.info("🖥️ Generated Fallback Device ID: {}", id);
                return id;
            }
        }
        String id = "UNKNOWN_DEVICE_" + UUID.randomUUID().toString().substring(0, 8);
        log.info("🖥️ Generated Random Device ID: {}", id);
        return id;
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
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
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
