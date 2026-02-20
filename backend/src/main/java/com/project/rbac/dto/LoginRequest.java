package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotBlank;

/**
 * Login Request DTO
 * Contains credentials and optional geolocation data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    /**
     * Latitude from browser geolocation (Google Maps API)
     * Optional - if not provided, location check will deny non-admin users
     */
    private Double latitude;

    /**
     * Longitude from browser geolocation (Google Maps API)
     * Optional - if not provided, location check will deny non-admin users
     */
    private Double longitude;
}
