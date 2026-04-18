package com.project.rbac.repository;

import com.project.rbac.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    
    // Find recent logs ordered by timestamp desc (latest first)
    List<AuditLog> findTop100ByOrderByTimestampDesc();
    
    // Find logs older than a specific date for archival
    List<AuditLog> findByTimestampBefore(java.time.LocalDateTime timestamp);
    
    // Advanced search for finding specific forensic traces
    @Query("SELECT a FROM AuditLog a WHERE " +
           "LOWER(a.actorUsername) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.targetUsername) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.action) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> searchLogs(@Param("query") String query);
}
