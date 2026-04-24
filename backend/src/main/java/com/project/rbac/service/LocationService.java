package com.project.rbac.service;

import com.project.rbac.dto.LocationConfigDTO;
import com.project.rbac.entity.LocationConfig;
import com.project.rbac.entity.User;
import com.project.rbac.repository.LocationConfigRepository;
import com.project.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final UserRepository userRepository;
    private final GeoLocationService geoLocationService;

    // Maximum acceptable distance (km) between browser GPS and IP geolocation.
    // IP geolocation is city-level accurate (~50-100km), so we use a generous threshold.
    private static final double GPS_IP_MISMATCH_THRESHOLD_KM = 200.0;

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
        return isLocationAllowed(latitude, longitude, null);
    }

    /**
     * Validate if the given coordinates are within the allowed login zone.
     * If userId is provided, checks the user's assigned location first.
     * Falls back to the global (most recent enabled) config.
     * If a user has an assigned location, checks against ALL enabled configs.
     */
    public boolean isLocationAllowed(Double latitude, Double longitude, Long userId) {
        if (latitude == null || longitude == null) {
            // If a specific user has location restrictions, null coords = DENY.
            // This prevents bypass by denying browser geolocation permission.
            if (userId != null) {
                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isPresent() && !userOpt.get().isLocationExempt()
                        && userOpt.get().getAssignedLocation() != null) {
                    log.warn("Location DENIED for user {}: coordinates are null but user has assigned location '{}'. "
                            + "Possible geolocation bypass attempt (permission denied or spoofed).",
                            userId, userOpt.get().getAssignedLocation().getLocationName());
                    return false;
                }
            }
            log.info("Location validation skipped: coordinates are null and user has no location restrictions");
            return true;
        }

        // 0. Check if user is location-exempt (no restriction applies)
        if (userId != null) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();

                // Exempt users bypass ALL location checks (global access)
                if (user.isLocationExempt()) {
                    log.info("User {} is location-exempt — allowing global access", userId);
                    return true;
                }

                // 1. Check user-specific assigned location
                if (user.getAssignedLocation() != null) {
                    LocationConfig userConfig = user.getAssignedLocation();
                    if (userConfig.isEnabled()) {
                        double distance = calculateDistance(latitude, longitude,
                                userConfig.getCenterLatitude(), userConfig.getCenterLongitude());
                        log.info("User-specific location check: User {} at ({}, {}), Zone '{}' at ({}, {}), Distance: {} km, Radius: {} km",
                                userId, latitude, longitude, userConfig.getLocationName(),
                                userConfig.getCenterLatitude(), userConfig.getCenterLongitude(),
                                String.format("%.2f", distance), userConfig.getRadiusKm());
                        boolean allowed = distance <= userConfig.getRadiusKm();
                        if (!allowed) {
                            log.warn("Login denied for user {}: {} km from assigned zone '{}' (max {} km)",
                                    userId, String.format("%.2f", distance), userConfig.getLocationName(), userConfig.getRadiusKm());
                        }
                        return allowed;
                    }
                }
            }
        }

        // 2. Fall back to checking against ALL enabled global configs
        List<LocationConfig> enabledConfigs = locationConfigRepository.findByEnabledTrue();

        if (enabledConfigs.isEmpty()) {
            log.info("No active location configuration found. Allowing login.");
            return true;
        }

        // User is allowed if they are within ANY enabled zone
        for (LocationConfig config : enabledConfigs) {
            double distance = calculateDistance(latitude, longitude,
                    config.getCenterLatitude(), config.getCenterLongitude());

            log.info("Global location check: User at ({}, {}), Zone '{}' at ({}, {}), Distance: {} km, Radius: {} km",
                    latitude, longitude, config.getLocationName(),
                    config.getCenterLatitude(), config.getCenterLongitude(),
                    String.format("%.2f", distance), config.getRadiusKm());

            if (distance <= config.getRadiusKm()) {
                log.info("Login allowed: user is within zone '{}'", config.getLocationName());
                return true;
            }
        }

        log.warn("Login location denied: user at ({}, {}) is outside all {} enabled zone(s)",
                latitude, longitude, enabledConfigs.size());
        return false;
    }

    /**
     * Check if location restriction is currently enabled
     */
    public boolean isLocationRestrictionEnabled() {
        return !locationConfigRepository.findByEnabledTrue().isEmpty();
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
     * Delete a location configuration.
     * Cascade-safe: unassigns all users referencing this config first.
     */
    @Transactional
    public void deleteConfig(Long configId) {
        // Unassign from all users who reference this location to avoid FK violation
        List<User> affectedUsers = userRepository.findByAssignedLocationId(configId);
        for (User u : affectedUsers) {
            u.setAssignedLocation(null);
            u.setLocationExempt(true); // Revert to global access
            userRepository.save(u);
            log.info("Auto-unassigned location from user '{}' before deletion", u.getUsername());
        }

        locationConfigRepository.deleteById(configId);
        log.info("Location config deleted: {} ({} user(s) unassigned)", configId, affectedUsers.size());
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

    // ══════════════════════════════════════════════════════════════
    //  IP CROSS-VERIFICATION & VPN DETECTION
    // ══════════════════════════════════════════════════════════════

    /**
     * Cross-verification result containing risk assessment data.
     */
    public static class LocationVerificationResult {
        private final boolean mismatch;
        private final boolean vpnDetected;
        private final double distanceKm;
        private final String ipLocation;
        private final String isp;
        private final String riskLevel;   // NONE, LOW, MEDIUM, HIGH, CRITICAL
        private final String details;

        public LocationVerificationResult(boolean mismatch, boolean vpnDetected, double distanceKm,
                                          String ipLocation, String isp, String riskLevel, String details) {
            this.mismatch = mismatch;
            this.vpnDetected = vpnDetected;
            this.distanceKm = distanceKm;
            this.ipLocation = ipLocation;
            this.isp = isp;
            this.riskLevel = riskLevel;
            this.details = details;
        }

        public boolean isMismatch()     { return mismatch; }
        public boolean isVpnDetected()  { return vpnDetected; }
        public double getDistanceKm()   { return distanceKm; }
        public String getIpLocation()   { return ipLocation; }
        public String getIsp()          { return isp; }
        public String getRiskLevel()    { return riskLevel; }
        public String getDetails()      { return details; }

        /** True if risk is HIGH or CRITICAL — should block login */
        public boolean shouldBlock()    { return "HIGH".equals(riskLevel) || "CRITICAL".equals(riskLevel); }

        public static LocationVerificationResult safe() {
            return new LocationVerificationResult(false, false, 0, "N/A", "N/A", "NONE",
                    "Cross-verification skipped (local network or unavailable)");
        }
    }

    /**
     * Cross-verify browser GPS coordinates against IP-based geolocation.
     * Detects GPS spoofing (e.g. Chrome DevTools, browser extensions) and VPN usage.
     *
     * Risk Levels:
     *   NONE     — Local IP or GeoIP unavailable (can't verify)
     *   LOW      — GPS and IP are in the same region (< 200km)
     *   MEDIUM   — GPS and IP are in different cities (200-500km)
     *   HIGH     — GPS and IP are in different regions (> 500km) — possible spoofing
     *   CRITICAL — VPN/Proxy detected AND location mismatch
     */
    public LocationVerificationResult crossVerifyLocation(
            Double browserLat, Double browserLon, String ipAddress) {

        if (browserLat == null || browserLon == null || ipAddress == null) {
            return LocationVerificationResult.safe();
        }

        GeoLocationService.GeoIpResult ipResult = geoLocationService.resolveDetailed(ipAddress);

        if (!ipResult.isSuccess() || ipResult.getLatitude() == null || ipResult.getLongitude() == null) {
            log.info("IP cross-verification skipped: GeoIP lookup returned no coordinates for IP");
            return LocationVerificationResult.safe();
        }

        // Calculate distance between browser GPS and IP geolocation
        double distance = calculateDistance(browserLat, browserLon,
                ipResult.getLatitude(), ipResult.getLongitude());

        boolean vpnDetected = ipResult.isSuspiciousNetwork();
        boolean mismatch = distance > GPS_IP_MISMATCH_THRESHOLD_KM;
        String ipLocation = ipResult.getDisplayLocation();
        String isp = ipResult.getIsp();

        // Determine risk level
        String riskLevel;
        String details;

        if (vpnDetected && mismatch) {
            riskLevel = "CRITICAL";
            details = String.format("VPN/Proxy detected (ISP: %s) AND location mismatch: "
                    + "Browser claims (%s, %s) but IP resolves to %s (%.0f km apart)",
                    isp, browserLat, browserLon, ipLocation, distance);
        } else if (vpnDetected) {
            riskLevel = "HIGH";
            details = String.format("VPN/Proxy detected (ISP: %s). IP resolves to %s. "
                    + "Location appears consistent (%.0f km) but network is suspicious",
                    isp, ipLocation, distance);
        } else if (distance > 500) {
            riskLevel = "HIGH";
            details = String.format("Significant location mismatch: Browser GPS (%s, %s) "
                    + "is %.0f km from IP location %s. Possible GPS spoofing",
                    browserLat, browserLon, distance, ipLocation);
        } else if (mismatch) {
            riskLevel = "MEDIUM";
            details = String.format("Moderate location discrepancy: Browser GPS (%s, %s) "
                    + "is %.0f km from IP location %s",
                    browserLat, browserLon, distance, ipLocation);
        } else {
            riskLevel = "LOW";
            details = String.format("Location consistent: Browser GPS and IP location %s "
                    + "are %.0f km apart (within threshold)",
                    ipLocation, distance);
        }

        log.info("IP Cross-Verification: Risk={}, Distance={}km, VPN={}, IP={}, ISP={}",
                riskLevel, String.format("%.0f", distance), vpnDetected, ipLocation, isp);

        return new LocationVerificationResult(mismatch, vpnDetected, distance,
                ipLocation, isp, riskLevel, details);
    }
}
