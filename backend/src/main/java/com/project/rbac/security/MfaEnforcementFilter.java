package com.project.rbac.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;

/**
 * Filter to enforce MFA verification state.
 * If a session has MFA_PENDING = true, this filter blocks all requests 
 * except for MFA verification, logout, and public auth endpoints.
 */
@Component
@Slf4j
public class MfaEnforcementFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Skip filtering for MFA verification, logout, login, health check, and device management
        if (path.contains("/api/auth/verify-mfa") || 
            path.contains("/api/auth/logout") || 
            path.contains("/api/auth/login") ||
            path.contains("/api/auth/register") ||
            path.contains("/api/auth/health") ||
            path.contains("/api/auth/trusted-devices") ||
            path.contains("/swagger-ui") ||
            path.contains("/v2/api-docs")) {
            filterChain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);
        if (session != null && Boolean.TRUE.equals(session.getAttribute("MFA_PENDING"))) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            if (auth != null && auth.isAuthenticated()) {
                log.warn("🚨 MFA_PENDING blocked request to: {} for user: {}", path, auth.getName());
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"MFA_REQUIRED\",\"mfaRequired\":true}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
