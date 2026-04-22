package com.project.rbac.config;

import com.project.rbac.entity.Role;
import com.project.rbac.entity.RoleName;
import com.project.rbac.entity.User;
import com.project.rbac.repository.RoleRepository;
import com.project.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Database Initializer
 * 
 * Initializes database with:
 * - Default roles (ROLE_USER, ROLE_ADMIN)
 * - Default admin user
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("=== DATABASE INITIALIZATION STARTED ===");

        // Create Spring Session tables if they don't exist
        initializeSpringSessionTables();

        // Initialize roles
        initializeRoles();

        // Initialize admin user
        initializeAdminUser();

        log.info("=== DATABASE INITIALIZATION COMPLETED ===\n");
    }

    /**
     * Create Spring Session JDBC tables if they don't exist.
     * This is the definitive fix for the "relation spring_session does not exist" error.
     * Spring Session's auto-init can fail when the platform SQL dialect is wrong.
     */
    private void initializeSpringSessionTables() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS SPRING_SESSION (" +
                "    PRIMARY_ID CHAR(36) NOT NULL," +
                "    SESSION_ID CHAR(36) NOT NULL," +
                "    CREATION_TIME BIGINT NOT NULL," +
                "    LAST_ACCESS_TIME BIGINT NOT NULL," +
                "    MAX_INACTIVE_INTERVAL INT NOT NULL," +
                "    EXPIRY_TIME BIGINT NOT NULL," +
                "    PRINCIPAL_NAME VARCHAR(100)," +
                "    CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID)" +
                ")"
            );
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS SPRING_SESSION_ATTRIBUTES (" +
                "    SESSION_PRIMARY_ID CHAR(36) NOT NULL," +
                "    ATTRIBUTE_NAME VARCHAR(200) NOT NULL," +
                "    ATTRIBUTE_BYTES BYTEA NOT NULL," +
                "    CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME)," +
                "    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION(PRIMARY_ID) ON DELETE CASCADE" +
                ")"
            );
            // Create indexes (IF NOT EXISTS is PostgreSQL 9.5+)
            try { jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS SPRING_SESSION_IX1 ON SPRING_SESSION (SESSION_ID)"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS SPRING_SESSION_IX2 ON SPRING_SESSION (EXPIRY_TIME)"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS SPRING_SESSION_IX3 ON SPRING_SESSION (PRINCIPAL_NAME)"); } catch (Exception ignored) {}
            
            log.info("✓ Spring Session tables verified/created");
        } catch (Exception e) {
            log.warn("⚠ Could not create Spring Session tables (may already exist or non-PostgreSQL DB): {}", e.getMessage());
        }
    }

    /**
     * Create default roles if they don't exist
     */
    private void initializeRoles() {
        // Create USER role
        if (!roleRepository.existsByName(RoleName.ROLE_USER)) {
            Role userRole = new Role(RoleName.ROLE_USER, "Standard user role");
            roleRepository.save(userRole);
            log.info("✓ Created ROLE_USER");
        } else {
            log.info("✓ ROLE_USER already exists");
        }

        // Create ADMIN role
        if (!roleRepository.existsByName(RoleName.ROLE_ADMIN)) {
            Role adminRole = new Role(RoleName.ROLE_ADMIN, "Administrator role with full access");
            roleRepository.save(adminRole);
            log.info("✓ Created ROLE_ADMIN");
        } else {
            log.info("✓ ROLE_ADMIN already exists");
        }
    }

    /**
     * Create default admin user if it doesn't exist
     */
    private void initializeAdminUser() {
        String adminUsername = "admin";

        if (!userRepository.existsByUsername(adminUsername)) {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail("admin@rbac.com");

            admin.setPassword(passwordEncoder.encode("admin123")); // Change in production!
            admin.setEnabled(true);
            admin.setAccountNonExpired(true);
            admin.setAccountNonLocked(true);
            admin.setCredentialsNonExpired(true);

            // Assign both USER and ADMIN roles
            Set<Role> roles = new HashSet<>();
            roles.add(roleRepository.findByName(RoleName.ROLE_USER).orElseThrow());
            roles.add(roleRepository.findByName(RoleName.ROLE_ADMIN).orElseThrow());
            admin.setRoles(roles);

            userRepository.save(admin);

            log.info("✓ Created default admin user");
            log.info("   Username: admin");
            log.info("   Password: admin123");
            log.info("   ⚠️  CHANGE PASSWORD IN PRODUCTION!");
        } else {
            // Force update password to ensure it matches 'admin123'
            // This fixes issues where the seeded hash might be incorrect
            User admin = userRepository.findByUsername(adminUsername).orElseThrow();
            admin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            log.info("✓ Admin user exists - Password verified/updated to 'admin123'");
        }
    }
}
