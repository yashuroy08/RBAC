package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {
    private List<DashboardChartDataDTO> riskTimeline;
    private List<DashboardChartDataDTO> sessionActivity;
    private Integer totalActiveSessions;
    private Long totalRiskEvents;
    private Double averageRiskScore;
}
