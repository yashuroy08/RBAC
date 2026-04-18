package com.project.rbac.config;

import com.project.rbac.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 * Session Listener to track session lifecycle events.
 * Specifically logs automatic timeouts to the Audit Log.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class SessionListener implements HttpSessionListener {

    private final AuditLogService auditLogService;

    @Override
    public void sessionCreated(HttpSessionEvent se) {
        log.debug("Session created: {}", se.getSession().getId());
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        // This is called when the session times out automatically OR is manually invalidated
        String sessionId = se.getSession().getId();
        log.info("Session destroyed/timed out: {}", sessionId);
        
        // Note: We don't have the User Context here because the session is being destroyed by the container.
        // But we can still log the event.
        auditLogService.logEvent("AUTH", "SESSION_EXPIRED", "INFO", 
                "SYSTEM", null, "Session timed out naturally or was cleared from memory", 
                "{\"sessionId\": \"" + sessionId + "\"}", "SUCCESS");
    }
}
