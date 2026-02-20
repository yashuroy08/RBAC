package com.project.rbac.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Location Configuration Entity
 * Stores the allowed login location center and radius.
 * Only one active configuration should exist at a time.
 */
@Entity
@Table(name = "location_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LocationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Center latitude of the allowed login zone
     */
    @Column(name = "center_latitude", nullable = false)
    private Double centerLatitude;

    /**
     * Center longitude of the allowed login zone
     */
    @Column(name = "center_longitude", nullable = false)
    private Double centerLongitude;

    /**
     * Allowed radius in kilometers from the center point
     */
    @Column(name = "radius_km", nullable = false)
    private Double radiusKm;

    /**
     * Human-readable name/label for this location
     */
    @Column(name = "location_name", length = 200)
    private String locationName;

    /**
     * Whether location-based restriction is currently enabled
     */
    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
