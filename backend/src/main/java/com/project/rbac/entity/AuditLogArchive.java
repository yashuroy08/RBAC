package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs_archive", indexes = {
    @Index(name = "idx_archive_timestamp", columnList = "timestamp"),
    @Index(name = "idx_archive_category", columnList = "category")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogArchive {

    @Id
    private Long id;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(name = "actor_username", nullable = false, length = 100)
    private String actorUsername;

    @Column(name = "target_username", length = 100)
    private String targetUsername;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "device_info", length = 300)
    private String deviceInfo;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(nullable = false, length = 20)
    private String outcome;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
