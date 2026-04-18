package com.project.rbac.config;

import com.project.rbac.entity.User;
import com.project.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Data Migration Runner
 *
 * Runs after the application context is fully initialized (including Hibernate DDL updates).
 * Backfills the `public_id` (UUID) column for any existing users
 * that were created before the field was introduced.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataMigrationRunner {

    private final UserRepository userRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        backfillPublicIds();
    }

    private void backfillPublicIds() {
        try {
            List<User> usersWithoutPublicId = userRepository.findAllByPublicIdIsNullOrEmpty();

            if (usersWithoutPublicId.isEmpty()) {
                log.info("✅ All users have public IDs assigned. No migration needed.");
                return;
            }

            log.info("🔧 Backfilling public_id for {} existing user(s)...", usersWithoutPublicId.size());

            for (User user : usersWithoutPublicId) {
                user.setPublicId(UUID.randomUUID().toString());
                userRepository.save(user);
                log.info("   → Assigned UUID {} to user '{}'", user.getPublicId(), user.getUsername());
            }

            log.info("✅ Public ID backfill complete.");
        } catch (Exception e) {
            log.error("⚠️ Public ID backfill failed (non-fatal): {}", e.getMessage());
        }
    }
}
