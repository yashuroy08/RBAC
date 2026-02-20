package com.project.rbac.repository;

import com.project.rbac.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User Repository - Data access layer for User entity
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by username
     * 
     * @param username Username to search
     * @return Optional User object
     */
    Optional<User> findByUsername(String username);

    /**
     * Find user by email
     * 
     * @param email Email to search
     * @return Optional User object
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if username exists
     * 
     * @param username Username to check
     * @return true if exists, false otherwise
     */
    Boolean existsByUsername(String username);

    /**
     * Check if email exists
     * 
     * @param email Email to check
     * @return true if exists, false otherwise
     */
    Boolean existsByEmail(String email);

    /**
     * Find user with roles eagerly loaded
     * 
     * @param username Username to search
     * @return Optional User with roles
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.username = :username")
    Optional<User> findByUsernameWithRoles(@Param("username") String username);
}
