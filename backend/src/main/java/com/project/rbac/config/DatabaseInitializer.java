package com.project.rbac.config;

import com.project.rbac.entity.Role;
import com.project.rbac.entity.RoleName;
import com.project.rbac.entity.User;
import com.project.rbac.repository.RoleRepository;
import com.project.rbac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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

    @Override
    public void run(String... args) throws Exception {
        log.info("=== DATABASE INITIALIZATION STARTED ===");

        // Initialize roles
        initializeRoles();

        // Initialize admin user
        initializeAdminUser();

        log.info("=== DATABASE INITIALIZATION COMPLETED ===\n");
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
