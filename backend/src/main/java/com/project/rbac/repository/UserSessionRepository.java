package com.project.rbac.repository;

import com.project.rbac.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * UserSession Repository - Data access layer for UserSession entity
 * Critical for Risk Evaluator functionality
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    /**
     * Find session by session ID
     * 
     * @param sessionId Session ID to search
     * @return Optional UserSession
     */
    Optional<UserSession> findBySessionId(String sessionId);

    /**
     * Find all active sessions for a specific user
     * 
     * @param userId User ID
     * @return List of active sessions
     */
    @Query("SELECT us FROM UserSession us WHERE us.user.id = :userId AND us.active = true")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") Long userId);

    /**
     * Count active sessions for a user
     * 
     * @param userId User ID
     * @return Count of active sessions
     */
    @Query("SELECT COUNT(us) FROM UserSession us WHERE us.user.id = :userId AND us.active = true")
    int countActiveSessionsByUserId(@Param("userId") Long userId);

    /**
     * Deactivate all sessions for a user
     * 
     * @param userId User ID
     */
    @Modifying
    @Query("UPDATE UserSession us SET us.active = false WHERE us.user.id = :userId AND us.active = true")
    void deactivateAllSessionsByUserId(@Param("userId") Long userId);

    /**
     * Delete inactive sessions
     */
    @Modifying
    @Query("DELETE FROM UserSession us WHERE us.active = false")
    void deleteInactiveSessions();

    /**
     * Find all sessions for a user (active and inactive)
     * 
     * @param userId User ID
     * @return List of all sessions
     */
    List<UserSession> findByUserId(Long userId);
}
