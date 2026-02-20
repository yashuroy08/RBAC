package com.project.rbac.repository;

import com.project.rbac.entity.RiskEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * RiskEvent Repository - Data access layer for RiskEvent entity
 */
@Repository
public interface RiskEventRepository extends JpaRepository<RiskEvent, Long> {

    /**
     * Find all risk events for a specific user
     * 
     * @param userId User ID
     * @return List of risk events
     */
    List<RiskEvent> findByUserId(Long userId);

    /**
     * Find risk events within a date range
     * 
     * @param startDate Start date
     * @param endDate   End date
     * @return List of risk events
     */
    @Query("SELECT re FROM RiskEvent re WHERE re.eventTime BETWEEN :startDate AND :endDate ORDER BY re.eventTime DESC")
    List<RiskEvent> findEventsBetweenDates(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find recent risk events for a user
     * 
     * @param userId User ID
     * @param limit  Number of events to retrieve
     * @return List of recent risk events
     */
    @Query(value = "SELECT * FROM risk_events WHERE user_id = :userId ORDER BY event_time DESC OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY", nativeQuery = true)
    List<RiskEvent> findRecentEventsByUserId(@Param("userId") Long userId, @Param("limit") int limit);
}
