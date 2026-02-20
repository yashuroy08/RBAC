package com.project.rbac.controller;

import com.project.rbac.dto.ApiResponse;
import com.project.rbac.dto.LocationConfigDTO;
import com.project.rbac.dto.UserResponse;
import com.project.rbac.service.LocationService;
import com.project.rbac.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Controller
 * 
 * Admin-only endpoints for:
 * - User management
 * - Role assignment
 * - Account control
 * - Location restriction management
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@Api(tags = "Admin Management APIs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final LocationService locationService;

    // ========================
    // USER MANAGEMENT ENDPOINTS
    // ========================

    /**
     * Get all users (Admin only)
     * 
     * GET /api/admin/users
     * 
     * @return List of all users
     */
    @GetMapping("/users")
    @ApiOperation("Get all users (Admin only)")
    public ResponseEntity<ApiResponse> getAllUsers() {
        try {
            List<UserResponse> users = userService.getAllUsers();
            return ResponseEntity.ok(ApiResponse.success(
                    "Users retrieved successfully",
                    users));
        } catch (Exception e) {
            log.error("Error getting all users: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Assign ADMIN role to user
     * 
     * POST /api/admin/users/{userId}/assign-admin
     * 
     * @param userId User ID
     * @return Updated user data
     */
    @PostMapping("/users/{userId}/assign-admin")
    @ApiOperation("Assign ADMIN role to user")
    public ResponseEntity<ApiResponse> assignAdminRole(@PathVariable Long userId) {
        try {
            UserResponse user = userService.assignAdminRole(userId);
            return ResponseEntity.ok(ApiResponse.success(
                    "ADMIN role assigned successfully",
                    user));
        } catch (Exception e) {
            log.error("Error assigning admin role: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Remove ADMIN role from user
     * 
     * POST /api/admin/users/{userId}/remove-admin
     * 
     * @param userId User ID
     * @return Updated user data
     */
    @PostMapping("/users/{userId}/remove-admin")
    @ApiOperation("Remove ADMIN role from user")
    public ResponseEntity<ApiResponse> removeAdminRole(@PathVariable Long userId) {
        try {
            UserResponse user = userService.removeAdminRole(userId);
            return ResponseEntity.ok(ApiResponse.success(
                    "ADMIN role removed successfully",
                    user));
        } catch (Exception e) {
            log.error("Error removing admin role: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Lock user account
     * 
     * POST /api/admin/users/{userId}/lock
     * 
     * @param userId User ID
     * @return Success message
     */
    @PostMapping("/users/{userId}/lock")
    @ApiOperation("Lock user account")
    public ResponseEntity<ApiResponse> lockUser(@PathVariable Long userId) {
        try {
            userService.lockUserAccount(userId);
            return ResponseEntity.ok(ApiResponse.success("User account locked successfully"));
        } catch (Exception e) {
            log.error("Error locking user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Unlock user account
     * 
     * POST /api/admin/users/{userId}/unlock
     * 
     * @param userId User ID
     * @return Success message
     */
    @PostMapping("/users/{userId}/unlock")
    @ApiOperation("Unlock user account")
    public ResponseEntity<ApiResponse> unlockUser(@PathVariable Long userId) {
        try {
            userService.unlockUserAccount(userId);
            return ResponseEntity.ok(ApiResponse.success("User account unlocked successfully"));
        } catch (Exception e) {
            log.error("Error unlocking user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Assign a specific location to a user
     * 
     * POST /api/admin/users/{userId}/assign-location/{locationId}
     */
    @PostMapping("/users/{userId}/assign-location/{locationId}")
    @ApiOperation("Assign a location restriction to a specific user")
    public ResponseEntity<ApiResponse> assignLocationToUser(
            @PathVariable Long userId,
            @PathVariable Long locationId) {
        try {
            UserResponse user = userService.assignLocationToUser(userId, locationId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Location assigned to user successfully", user));
        } catch (Exception e) {
            log.error("Error assigning location to user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Remove assigned location from a user (falls back to global)
     * 
     * POST /api/admin/users/{userId}/remove-location
     */
    @PostMapping("/users/{userId}/remove-location")
    @ApiOperation("Remove assigned location from a user")
    public ResponseEntity<ApiResponse> removeLocationFromUser(@PathVariable Long userId) {
        try {
            UserResponse user = userService.removeLocationFromUser(userId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Location removed from user", user));
        } catch (Exception e) {
            log.error("Error removing location from user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========================
    // LOCATION MANAGEMENT ENDPOINTS
    // ========================

    /**
     * Get the active location configuration
     * 
     * GET /api/admin/location/active
     */
    @GetMapping("/location/active")
    @ApiOperation("Get active location restriction configuration")
    public ResponseEntity<ApiResponse> getActiveLocationConfig() {
        try {
            LocationConfigDTO config = locationService.getActiveConfig();
            if (config == null) {
                return ResponseEntity.ok(ApiResponse.success(
                        "No active location restriction configured", null));
            }
            return ResponseEntity.ok(ApiResponse.success(
                    "Active location config retrieved", config));
        } catch (Exception e) {
            log.error("Error getting active location config: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Get all location configurations
     * 
     * GET /api/admin/location/all
     */
    @GetMapping("/location/all")
    @ApiOperation("Get all location configurations")
    public ResponseEntity<ApiResponse> getAllLocationConfigs() {
        try {
            List<LocationConfigDTO> configs = locationService.getAllConfigs();
            return ResponseEntity.ok(ApiResponse.success(
                    "Location configs retrieved", configs));
        } catch (Exception e) {
            log.error("Error getting location configs: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Save or update location configuration
     * 
     * POST /api/admin/location
     */
    @PostMapping("/location")
    @ApiOperation("Save or update location restriction configuration")
    public ResponseEntity<ApiResponse> saveLocationConfig(@RequestBody LocationConfigDTO config) {
        try {
            LocationConfigDTO saved = locationService.saveConfig(config);
            return ResponseEntity.ok(ApiResponse.success(
                    "Location configuration saved successfully", saved));
        } catch (Exception e) {
            log.error("Error saving location config: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Toggle location restriction on/off
     * 
     * PUT /api/admin/location/{configId}/toggle
     */
    @PutMapping("/location/{configId}/toggle")
    @ApiOperation("Toggle location restriction enabled/disabled")
    public ResponseEntity<ApiResponse> toggleLocationRestriction(
            @PathVariable Long configId,
            @RequestParam boolean enabled) {
        try {
            LocationConfigDTO updated = locationService.toggleRestriction(configId, enabled);
            return ResponseEntity.ok(ApiResponse.success(
                    "Location restriction " + (enabled ? "enabled" : "disabled"), updated));
        } catch (Exception e) {
            log.error("Error toggling location restriction: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Delete a location configuration
     * 
     * DELETE /api/admin/location/{configId}
     */
    @DeleteMapping("/location/{configId}")
    @ApiOperation("Delete a location configuration")
    public ResponseEntity<ApiResponse> deleteLocationConfig(@PathVariable Long configId) {
        try {
            locationService.deleteConfig(configId);
            return ResponseEntity.ok(ApiResponse.success("Location configuration deleted"));
        } catch (Exception e) {
            log.error("Error deleting location config: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
