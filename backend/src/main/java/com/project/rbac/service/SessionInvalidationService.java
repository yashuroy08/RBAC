package com.project.rbac.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.session.FindByIndexNameSessionRepository;
import org.springframework.session.Session;
import org.springframework.stereotype.Service;

/**
 * Session Invalidation Service
 * 
 * Handles actual HTTP session invalidation using Spring Session
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionInvalidationService {

    private final FindByIndexNameSessionRepository<? extends Session> sessionRepository;

    /**
     * Invalidate a session by its ID
     * 
     * @param sessionId Session ID to invalidate
     */
    public void invalidateSession(String sessionId) {
        try {
            log.info("Attempting to invalidate session ID: {}", sessionId);
            // Check if session exists first
            Session session = sessionRepository.findById(sessionId);
            if (session != null) {
                sessionRepository.deleteById(sessionId);
                log.info("✅ Session {} successfully deleted from Spring Session repository", sessionId);
            } else {
                log.warn("❓ Session {} not found in Spring Session repository - it may have already expired",
                        sessionId);
            }
        } catch (Exception e) {
            log.error("❌ Failed to invalidate session {}: {}", sessionId, e.getMessage());
        }
    }

    /**
     * Check if a session is valid
     * 
     * @param sessionId Session ID to check
     * @return true if session exists and is valid
     */
    public boolean isSessionValid(String sessionId) {
        try {
            Session session = sessionRepository.findById(sessionId);
            return session != null && !session.isExpired();
        } catch (Exception e) {
            log.error("Error checking session validity: {}", e.getMessage());
            return false;
        }
    }
}
