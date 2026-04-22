package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * TrustedDevice Entity - Tracks verified and recognized devices for a user
 */
@Entity
@Table(name = "trusted_devices", indexes = {
        @Index(name = "idx_user_device", columnList = "user_id, device_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrustedDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "device_id", nullable = false, length = 255)
    private String deviceId; // Hashed identifier of the device

    @Column(name = "device_name", length = 100)
    private String deviceName; // Readable name (e.g. Chrome on Windows)

    @Column(name = "is_trusted")
    private boolean trusted = true;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "location", length = 100)
    private String location; // Geo-resolved location (e.g. "Mumbai, India")

    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastLoginTime = LocalDateTime.now();
    }
}
