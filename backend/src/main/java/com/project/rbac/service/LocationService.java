package com.project.rbac.service;

import com.project.rbac.dto.LocationConfigDTO;
import com.project.rbac.entity.LocationConfig;
import com.project.rbac.repository.LocationConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Location Service
 * Handles geolocation validation for login restriction.
 * Uses the Haversine formula to calculate distance between two coordinates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationService {

    private final LocationConfigRepository locationConfigRepository;

    // Earth's radius in kilometers
    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Validate if the given coordinates are within the allowed login zone.
     *
     * @param latitude  User's latitude
     * @param longitude User's longitude
     * @return true if location is within allowed range, false otherwise
     */
    public boolean isLocationAllowed(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            log.warn("Location validation skipped: coordinates are null (browser may not support geolocation)");
            return true;
        }

        Optional<LocationConfig> configOpt = locationConfigRepository.findTopByEnabledTrueOrderByUpdatedAtDesc();

        if (!configOpt.isPresent()) {
            // No active location config exists - allow login (feature not configured)
            log.info("No active location configuration found. Allowing login.");
            return true;
        }

        LocationConfig config = configOpt.get();

        double distance = calculateDistance(
                latitude, longitude,
                config.getCenterLatitude(), config.getCenterLongitude());

        log.info("Location check: User at ({}, {}), Center at ({}, {}), Distance: {} km, Allowed radius: {} km",
                latitude, longitude,
                config.getCenterLatitude(), config.getCenterLongitude(),
                distance, config.getRadiusKm());

        boolean allowed = distance <= config.getRadiusKm();

        if (!allowed) {
            log.warn("Login location denied. Distance {} km exceeds allowed radius {} km", distance,
                    config.getRadiusKm());
        }

        return allowed;
    }

    /**
     * Check if location restriction is currently enabled
     */
    public boolean isLocationRestrictionEnabled() {
        return locationConfigRepository.findTopByEnabledTrueOrderByUpdatedAtDesc().isPresent();
    }

    /**
     * Get the active location configuration
     */
    public LocationConfigDTO getActiveConfig() {
        Optional<LocationConfig> configOpt = locationConfigRepository.findTopByEnabledTrueOrderByUpdatedAtDesc();
        return configOpt.map(this::toDTO).orElse(null);
    }

    /**
     * Get all location configurations
     */
    public List<LocationConfigDTO> getAllConfigs() {
        return locationConfigRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Save or update location configuration
     */
    public LocationConfigDTO saveConfig(LocationConfigDTO dto) {
        LocationConfig config;

        if (dto.getId() != null) {
            config = locationConfigRepository.findById(dto.getId())
                    .orElse(new LocationConfig());
        } else {
            config = new LocationConfig();
        }

        config.setCenterLatitude(dto.getCenterLatitude());
        config.setCenterLongitude(dto.getCenterLongitude());
        config.setRadiusKm(dto.getRadiusKm());
        config.setLocationName(dto.getLocationName());
        config.setEnabled(dto.isEnabled());

        LocationConfig saved = locationConfigRepository.save(config);
        log.info("Location config saved: {} ({}, {}) radius {} km, enabled: {}",
                saved.getLocationName(),
                saved.getCenterLatitude(), saved.getCenterLongitude(),
                saved.getRadiusKm(), saved.isEnabled());

        return toDTO(saved);
    }

    /**
     * Toggle location restriction on/off
     */
    public LocationConfigDTO toggleRestriction(Long configId, boolean enabled) {
        LocationConfig config = locationConfigRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Location configuration not found"));

        config.setEnabled(enabled);
        LocationConfig saved = locationConfigRepository.save(config);
        log.info("Location restriction {}: {}", enabled ? "enabled" : "disabled", saved.getLocationName());

        return toDTO(saved);
    }

    /**
     * Delete a location configuration
     */
    public void deleteConfig(Long configId) {
        locationConfigRepository.deleteById(configId);
        log.info("Location config deleted: {}", configId);
    }

    /**
     * Calculate distance between two geographic points using the Haversine formula.
     *
     * @param lat1 Latitude of point 1
     * @param lon1 Longitude of point 1
     * @param lat2 Latitude of point 2
     * @param lon2 Longitude of point 2
     * @return Distance in kilometers
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * Convert entity to DTO
     */
    private LocationConfigDTO toDTO(LocationConfig config) {
        return new LocationConfigDTO(
                config.getId(),
                config.getCenterLatitude(),
                config.getCenterLongitude(),
                config.getRadiusKm(),
                config.getLocationName(),
                config.isEnabled());
    }
}
