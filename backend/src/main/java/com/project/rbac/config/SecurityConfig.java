package com.project.rbac.config;

import com.project.rbac.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * Spring Security Configuration
 * 
 * Configures:
 * 1. BCrypt password encoding
 * 2. Session-based authentication
 * 3. Role-based access control
 * 4. Session management and concurrency control
 * 5. CORS configuration
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true, jsr250Enabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    /**
     * BCrypt Password Encoder Bean
     * Strength: 10 (default) - provides good security/performance balance
     * 
     * BCrypt automatically handles:
     * - Salt generation
     * - Multiple rounds of hashing
     * - Secure password storage
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Authentication Provider
     * Connects UserDetailsService with PasswordEncoder
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Authentication Manager Bean
     * Required for manual authentication in AuthService
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * HTTP Security Configuration
     * 
     * Key Features:
     * - Session-based authentication
     * - Role-based endpoint protection
     * - Session fixation protection
     * - Concurrent session control
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Authentication Provider
                .authenticationProvider(authenticationProvider())

                // CORS configuration
                .cors().and()

                // CSRF Configuration
                // NOTE: Disabled for easier REST API testing with Postman
                // In production with web frontend, enable CSRF protection
                .csrf().disable()

                // Session Management Configuration
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().migrateSession() // Prevent session fixation attacks
                .maximumSessions(10) // Allow up to 10 concurrent sessions (Risk Evaluator will handle)
                .maxSessionsPreventsLogin(false) // Don't block new logins, let Risk Evaluator handle it
                .and()
                .and()

                // Authorization Configuration
                .authorizeRequests()
                // Public endpoints - no authentication required
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/public/**").permitAll()

                // Swagger documentation endpoints
                .antMatchers(
                        "/v2/api-docs",
                        "/swagger-resources/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/webjars/**")
                .permitAll()

                // Admin-only endpoints
                .antMatchers("/api/admin/**").hasRole("ADMIN")

                // User endpoints - requires authentication
                .antMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")

                // Risk evaluator endpoints - Admin only
                .antMatchers("/api/risk/**").hasRole("ADMIN")

                // All other requests require authentication
                .anyRequest().authenticated()
                .and()

                // Logout configuration
                .logout()
                .logoutUrl("/api/auth/logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "RBAC_SESSION")
                .logoutSuccessHandler((request, response, authentication) -> {
                    response.setStatus(200);
                    response.getWriter().write("{\"success\":true,\"message\":\"Logged out successfully\"}");
                    response.setContentType("application/json");
                })
                .and()

                // Exception handling
                .exceptionHandling()
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized - Please login\"}");
                    response.setContentType("application/json");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.getWriter()
                            .write("{\"success\":false,\"message\":\"Access Denied - Insufficient permissions\"}");
                    response.setContentType("application/json");
                });

        return http.build();
    }

    /**
     * CORS Configuration
     * Allows requests from React frontend
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type",
                "X-Requested-With", "Origin", "Accept", "X-Custom-Header"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Collections.singletonList("Set-Cookie"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
