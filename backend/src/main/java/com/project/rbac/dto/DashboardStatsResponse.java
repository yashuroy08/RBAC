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
    private List<DashboardChartDataDTO> riskTimelinePoints;
    private List<DashboardChartDataDTO> sessionActivityPoints;
    private Integer activeSessions;
    private Long totalRiskEvents;
    private Double averageRiskScore;
    private Integer mfaRequiredUsers;
}
