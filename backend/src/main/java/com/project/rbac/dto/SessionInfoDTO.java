package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Session Info DTO
 * Contains information about a user session
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoDTO {

    private Long id;
    private String sessionId;
    private String deviceId;
    private String ipAddress;
    private LocalDateTime loginTime;
    private LocalDateTime lastAccessedTime;
    private boolean active;
}
