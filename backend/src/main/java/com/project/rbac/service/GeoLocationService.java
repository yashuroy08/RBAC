package com.project.rbac.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Lightweight IP Geolocation Service
 * Uses the free ip-api.com endpoint (no API key required, 45 req/min limit).
 * Returns location data including coordinates for cross-verification.
 */
@Service
@Slf4j
public class GeoLocationService {

    private static final String API_URL = "http://ip-api.com/json/%s?fields=status,city,country,lat,lon,isp,proxy,hosting";
    private static final int TIMEOUT_MS = 3000;

    /**
     * Full GeoIP lookup result with coordinates and network intelligence.
     */
    public static class GeoIpResult {
        private final String city;
        private final String country;
        private final Double latitude;
        private final Double longitude;
        private final String isp;
        private final boolean isProxy;     // VPN / Proxy detected
        private final boolean isHosting;   // Datacenter / Hosting provider
        private final boolean success;

        public GeoIpResult(String city, String country, Double latitude, Double longitude,
                           String isp, boolean isProxy, boolean isHosting, boolean success) {
            this.city = city;
            this.country = country;
            this.latitude = latitude;
            this.longitude = longitude;
            this.isp = isp;
            this.isProxy = isProxy;
            this.isHosting = isHosting;
            this.success = success;
        }

        public String getCity()      { return city; }
        public String getCountry()   { return country; }
        public Double getLatitude()  { return latitude; }
        public Double getLongitude() { return longitude; }
        public String getIsp()       { return isp; }
        public boolean isProxy()     { return isProxy; }
        public boolean isHosting()   { return isHosting; }
        public boolean isSuccess()   { return success; }

        public String getDisplayLocation() {
            if (city != null && !city.isEmpty()) return city + ", " + country;
            return country != null ? country : "Unknown";
        }

        /** True if the IP is behind a VPN, proxy, or datacenter */
        public boolean isSuspiciousNetwork() {
            return isProxy || isHosting;
        }

        public static GeoIpResult unknown() {
            return new GeoIpResult(null, null, null, null, null, false, false, false);
        }
    }

    /**
     * Resolve an IP address to a "City, Country" string.
     * Returns "Unknown" on any failure so it never blocks login.
     */
    @Cacheable(value = "geoLocations", key = "#ipAddress", unless = "#result == 'Unknown'")
    public String resolve(String ipAddress) {
        GeoIpResult result = resolveDetailed(ipAddress);
        return result.isSuccess() ? result.getDisplayLocation() : 
               isPrivateIp(ipAddress) ? "Local Network" : "Unknown";
    }

    /**
     * Full GeoIP lookup returning coordinates, ISP, and proxy/VPN detection.
     * Used for cross-verification against browser GPS coordinates.
     */
    @Cacheable(value = "geoIpDetails", key = "#ipAddress")
    public GeoIpResult resolveDetailed(String ipAddress) {
        if (isPrivateIp(ipAddress)) {
            log.debug("Private/local IP detected: {}", ipAddress);
            return new GeoIpResult("Local", "Network", null, null, "Local", false, false, true);
        }

        try {
            URL url = new URL(String.format(API_URL, ipAddress));
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);

            if (conn.getResponseCode() != 200) {
                log.warn("Geo API returned HTTP {}", conn.getResponseCode());
                return GeoIpResult.unknown();
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            String json = sb.toString();
            if (json.contains("\"status\":\"success\"")) {
                String city = extractStringField(json, "city");
                String country = extractStringField(json, "country");
                Double lat = extractDoubleField(json, "lat");
                Double lon = extractDoubleField(json, "lon");
                String isp = extractStringField(json, "isp");
                boolean proxy = extractBooleanField(json, "proxy");
                boolean hosting = extractBooleanField(json, "hosting");

                log.debug("GeoIP resolved {} → {}, {} ({}, {}) ISP: {} Proxy: {} Hosting: {}",
                        maskIp(ipAddress), city, country, lat, lon, isp, proxy, hosting);

                return new GeoIpResult(city, country, lat, lon, isp, proxy, hosting, true);
            }

            return GeoIpResult.unknown();
        } catch (Exception e) {
            log.warn("GeoIP lookup failed for {}: {}", maskIp(ipAddress), e.getMessage());
            return GeoIpResult.unknown();
        }
    }

    private boolean isPrivateIp(String ip) {
        return ip == null || ip.isBlank()
                || ip.equals("127.0.0.1")
                || ip.equals("0:0:0:0:0:0:0:1")
                || ip.startsWith("192.168.")
                || ip.startsWith("10.")
                || ip.startsWith("172.16.")
                || ip.startsWith("172.17.")
                || ip.startsWith("172.18.");
    }

    /** Extract a simple string field from a flat JSON object */
    private String extractStringField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start == -1) return null;
        start += key.length();
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : null;
    }

    /** Extract a numeric field from a flat JSON object */
    private Double extractDoubleField(String json, String field) {
        // Handles both "lat":12.34 and "lat": 12.34
        String key = "\"" + field + "\":";
        int start = json.indexOf(key);
        if (start == -1) return null;
        start += key.length();
        // Skip whitespace
        while (start < json.length() && json.charAt(start) == ' ') start++;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '.' || json.charAt(end) == '-')) {
            end++;
        }
        try {
            return Double.parseDouble(json.substring(start, end));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Extract a boolean field from a flat JSON object */
    private boolean extractBooleanField(String json, String field) {
        String key = "\"" + field + "\":";
        int start = json.indexOf(key);
        if (start == -1) return false;
        start += key.length();
        return json.substring(start).trim().startsWith("true");
    }

    private String maskIp(String ip) {
        if (ip == null || !ip.contains(".")) return "***";
        int lastDot = ip.lastIndexOf(".");
        return ip.substring(0, lastDot) + ".***";
    }
}
