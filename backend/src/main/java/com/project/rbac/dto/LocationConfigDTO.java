package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Location Configuration
 * Used for admin API requests and responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationConfigDTO {

    private Long id;
    private Double centerLatitude;
    private Double centerLongitude;
    private Double radiusKm;
    private String locationName;
    private boolean enabled;
}
