package com.project.rbac.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TrustedDeviceDTO {
    private Long id;
    private String deviceId;
    private String deviceName;
    private boolean trusted;
    private LocalDateTime lastLoginTime;
    private LocalDateTime createdAt;
}
