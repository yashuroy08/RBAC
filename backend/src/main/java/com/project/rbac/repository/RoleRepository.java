package com.project.rbac.repository;

import com.project.rbac.entity.Role;
import com.project.rbac.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Role Repository - Data access layer for Role entity
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Find role by name
     * 
     * @param name Role name enum
     * @return Optional Role object
     */
    Optional<Role> findByName(RoleName name);

    /**
     * Check if role exists by name
     * 
     * @param name Role name enum
     * @return true if exists, false otherwise
     */
    Boolean existsByName(RoleName name);
}
