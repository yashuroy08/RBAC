package com.project.rbac.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Root Controller — Provides service info and health check at the root URL.
 * Prevents the Whitelabel Error Page from showing when visiting the base URL.
 */
@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("service", "RBAC Risk Evaluator System");
        info.put("version", "1.0.0");
        info.put("status", "RUNNING");
        info.put("timestamp", LocalDateTime.now().toString());
        info.put("endpoints", Map.of(
                "health", "/api/auth/health",
                "login", "POST /api/auth/login",
                "register", "POST /api/auth/register",
                "swagger", "/swagger-ui/"
        ));
        return ResponseEntity.ok(info);
    }
}
