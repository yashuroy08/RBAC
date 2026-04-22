package com.project.rbac.service;

import com.project.rbac.dto.DashboardChartDataDTO;
import com.project.rbac.dto.DashboardStatsResponse;
import com.project.rbac.entity.RiskEvent;
import com.project.rbac.entity.UserSession;
import com.project.rbac.repository.RiskEventRepository;
import com.project.rbac.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final RiskEventRepository riskEventRepository;
    private final UserSessionRepository userSessionRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String range) {
        log.info("Fetching dashboard stats for range: {}", range);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        int points;
        ChronoUnit unit;
        DateTimeFormatter formatter;

        switch (range.toLowerCase()) {
            case "hours":
                start = now.minusHours(12);
                points = 12;
                unit = ChronoUnit.HOURS;
                formatter = DateTimeFormatter.ofPattern("HH:mm");
                break;
            case "days":
                start = now.minusDays(7);
                points = 7;
                unit = ChronoUnit.DAYS;
                formatter = DateTimeFormatter.ofPattern("EEE");
                break;
            case "weeks":
                start = now.minusWeeks(4);
                points = 4;
                unit = ChronoUnit.WEEKS;
                formatter = DateTimeFormatter.ofPattern("'W'w MMM");
                break;
            case "months":
                start = now.minusMonths(6);
                points = 6;
                unit = ChronoUnit.MONTHS;
                formatter = DateTimeFormatter.ofPattern("MMM");
                break;
            default:
                start = now.minusHours(12);
                points = 12;
                unit = ChronoUnit.HOURS;
                formatter = DateTimeFormatter.ofPattern("HH:mm");
                break;
        }

        List<RiskEvent> riskEvents = riskEventRepository.findEventsBetweenDates(start, now);
        List<UserSession> sessions = userSessionRepository.findAll(); // Optimization: could filter by date if needed

        List<DashboardChartDataDTO> riskTimeline = new ArrayList<>();
        List<DashboardChartDataDTO> sessionActivity = new ArrayList<>();

        for (int i = 0; i < points; i++) {
            LocalDateTime pointTime = start.plus(i + 1, unit);
            LocalDateTime pointStart = pointTime.minus(1, unit);
            String label = pointTime.format(formatter);

            // Risk Timeline (Average risk score or count of events?)
            // Front-end expects "score"
            double avgRisk = riskEvents.stream()
                .filter(e -> !e.getEventTime().isBefore(pointStart) && e.getEventTime().isBefore(pointTime))
                .mapToDouble(RiskEvent::getRiskScore)
                .average()
                .orElse(0.0);
            
            // If no events, and it's the latest point, maybe use current global risk? 
            // For now, if no events, we'll keep it at a baseline or 0
            riskTimeline.add(new DashboardChartDataDTO(label, avgRisk)); // Real data — 0.0 when no events

            // Session Activity
            long activeInSlot = sessions.stream()
                .filter(s -> s.isActive() && !s.getLoginTime().isAfter(pointTime))
                .count();
            
            sessionActivity.add(new DashboardChartDataDTO(label, (double) activeInSlot));
        }

        long totalRiskEvents = riskEventRepository.count();
        int totalActiveSessions = (int) sessions.stream().filter(UserSession::isActive).count();
        double avgRisk = riskEvents.stream().mapToDouble(RiskEvent::getRiskScore).average().orElse(0.0);
        
        // Count users who triggered MFA (risk score >= 70) from recent risk events
        int mfaRequired = (int) riskEvents.stream()
                .filter(e -> e.getRiskScore() >= 70)
                .map(RiskEvent::getUserId)
                .distinct()
                .count();

        return DashboardStatsResponse.builder()
                .riskTimelinePoints(riskTimeline)
                .sessionActivityPoints(sessionActivity)
                .activeSessions(totalActiveSessions)
                .totalRiskEvents(totalRiskEvents)
                .averageRiskScore(avgRisk)
                .mfaRequiredUsers(mfaRequired)
                .build();
    }
}
