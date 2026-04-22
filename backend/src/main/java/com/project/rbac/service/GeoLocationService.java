package com.project.rbac.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Lightweight IP Geolocation Service
 * Uses the free ip-api.com endpoint (no API key required, 45 req/min limit).
 * Returns "City, Country" or a fallback string on failure.
 */
@Service
@Slf4j
public class GeoLocationService {

    private static final String API_URL = "http://ip-api.com/json/%s?fields=status,city,country";
    private static final int TIMEOUT_MS = 3000;

    /**
     * Resolve an IP address to a "City, Country" string.
     * Returns "Unknown" on any failure so it never blocks login.
     */
    public String resolve(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()
                || ipAddress.equals("127.0.0.1")
                || ipAddress.equals("0:0:0:0:0:0:0:1")
                || ipAddress.startsWith("192.168.")
                || ipAddress.startsWith("10.")) {
            return "Local Network";
        }

        try {
            URL url = new URL(String.format(API_URL, ipAddress));
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(TIMEOUT_MS);
            conn.setReadTimeout(TIMEOUT_MS);

            if (conn.getResponseCode() != 200) {
                log.warn("Geo API returned HTTP {}", conn.getResponseCode());
                return "Unknown";
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            // Minimal JSON parsing to avoid adding a dependency
            String json = sb.toString();
            if (json.contains("\"status\":\"success\"")) {
                String city = extractField(json, "city");
                String country = extractField(json, "country");
                String result = (city != null && !city.isEmpty()) ? city + ", " + country : country;
                log.debug("Geo resolved {} → {}", ipAddress, result);
                return result != null ? result : "Unknown";
            }

            return "Unknown";
        } catch (Exception e) {
            log.warn("Geo lookup failed for {}: {}", ipAddress, e.getMessage());
            return "Unknown";
        }
    }

    /** Extract a simple string field from a flat JSON object */
    private String extractField(String json, String field) {
        String key = "\"" + field + "\":\"";
        int start = json.indexOf(key);
        if (start == -1) return null;
        start += key.length();
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : null;
    }
}
