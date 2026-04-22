package com.project.rbac.controller;

import com.project.rbac.dto.ApiResponse;
import com.project.rbac.dto.DashboardStatsResponse;
import com.project.rbac.service.DashboardService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@Api(tags = "Admin Dashboard APIs")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @ApiOperation("Get aggregated dashboard stats for charts")
    public ResponseEntity<ApiResponse> getDashboardStats(@RequestParam(defaultValue = "hours") String range) {
        try {
            DashboardStatsResponse stats = dashboardService.getDashboardStats(range);
            return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved", stats));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
