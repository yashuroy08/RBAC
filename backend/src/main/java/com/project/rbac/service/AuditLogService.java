package com.project.rbac.service;

import com.project.rbac.entity.AuditLog;
import com.project.rbac.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * Enterprise Audit Logging Service
 * 
 * Intercepts and records critical system actions.
 * Extracts context (IP, User-Agent, Session) automatically from the current HTTP Request.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Records an audit event.
     * Uses REQUIRES_NEW to ensure the log is committed even if the main transaction is rolled back 
     * (e.g. logging a failed login attempt or unauthorized access exception).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(String category, String action, String severity, 
                         String actorUsername, String targetUsername, 
                         String description, String metadata, String outcome) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setCategory(category);
            auditLog.setAction(action);
            auditLog.setSeverity(severity);
            
            // "SYSTEM" is used when no actor is explicitly provided (background jobs, etc.)
            auditLog.setActorUsername(actorUsername != null ? actorUsername : "SYSTEM");
            auditLog.setTargetUsername(targetUsername);
            auditLog.setDescription(description);
            auditLog.setMetadata(metadata);
            auditLog.setOutcome(outcome);
            
            // Extract Network Identity (IP & Device) from current HTTP Request if available
            HttpServletRequest request = getCurrentHttpRequest();
            if (request != null) {
                auditLog.setIpAddress(extractClientIp(request));
                // Extract browser/device signature securely
                String userAgent = request.getHeader("User-Agent");
                auditLog.setDeviceInfo(userAgent != null && userAgent.length() > 300 ? userAgent.substring(0, 297) + "..." : userAgent);
                
                if (request.getSession(false) != null) {
                    auditLog.setSessionId(request.getSession(false).getId());
                }
            }
            
            auditLogRepository.saveAndFlush(auditLog);
            log.info("🛡️ [AUDIT] {}: {} by {} -> {}", category, action, auditLog.getActorUsername(), outcome);
            
        } catch (Exception e) {
            // We log the failure but do not throw, so we don't break the main business flow
            log.error("💥 CRITICAL: Failed to write audit log! Event may be lost. Error: {}", e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }
    
    @Transactional(readOnly = true)
    public List<AuditLog> searchLogs(String query) {
        return auditLogRepository.searchLogs(query);
    }
    
    private HttpServletRequest getCurrentHttpRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null; // May happen in background threads
        }
    }
    
    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
