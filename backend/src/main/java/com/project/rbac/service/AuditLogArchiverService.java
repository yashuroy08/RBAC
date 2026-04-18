package com.project.rbac.service;

import com.project.rbac.entity.AuditLog;
import com.project.rbac.entity.AuditLogArchive;
import com.project.rbac.repository.AuditLogArchiveRepository;
import com.project.rbac.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogArchiverService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogArchiveRepository auditLogArchiveRepository;

    /**
     * Scheduled task to archive old audit logs to a separate table
     * Runs every day at 2:00 AM server time.
     */
    @Scheduled(cron = "0 0 2 * * ?") 
    @Transactional
    public void archiveOldAuditLogs() {
        LocalDateTime thresholdDate = LocalDateTime.now().minusDays(90);
        log.info("Starting audit log archival for events older than {}", thresholdDate);

        List<AuditLog> oldLogs = auditLogRepository.findByTimestampBefore(thresholdDate);

        if (oldLogs.isEmpty()) {
            log.info("No audit logs found older than 90 days. Archival skipped.");
            return;
        }

        List<AuditLogArchive> archives = oldLogs.stream().map(this::convertToArchive).collect(Collectors.toList());

        auditLogArchiveRepository.saveAllAndFlush(archives);
        auditLogRepository.deleteAllInBatch(oldLogs);

        log.info("Successfully archived and removed {} old audit logs from primary table.", oldLogs.size());
    }

    private AuditLogArchive convertToArchive(AuditLog logEvent) {
        return new AuditLogArchive(
                logEvent.getId(),
                logEvent.getCategory(),
                logEvent.getAction(),
                logEvent.getSeverity(),
                logEvent.getActorUsername(),
                logEvent.getTargetUsername(),
                logEvent.getDescription(),
                logEvent.getMetadata(),
                logEvent.getIpAddress(),
                logEvent.getDeviceInfo(),
                logEvent.getSessionId(),
                logEvent.getOutcome(),
                logEvent.getTimestamp()
        );
    }
}
