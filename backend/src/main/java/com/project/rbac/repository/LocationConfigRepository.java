package com.project.rbac.repository;

import com.project.rbac.entity.LocationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for LocationConfig entity
 */
@Repository
public interface LocationConfigRepository extends JpaRepository<LocationConfig, Long> {

    /**
     * Find the first (active) location config ordered by most recent
     */
    Optional<LocationConfig> findTopByEnabledTrueOrderByUpdatedAtDesc();
}
