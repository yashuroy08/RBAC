package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * API Response DTO
 * Standard response wrapper for all API endpoints
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {

    private Boolean success;
    private String message;
    private Object data;

    public ApiResponse(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    // Success response factory methods
    public static ApiResponse success(String message) {
        return new ApiResponse(true, message);
    }

    public static ApiResponse success(String message, Object data) {
        return new ApiResponse(true, message, data);
    }

    // Error response factory methods
    public static ApiResponse error(String message) {
        return new ApiResponse(false, message);
    }

    public static ApiResponse error(String message, Object data) {
        return new ApiResponse(false, message, data);
    }
}
