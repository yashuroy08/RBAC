package com.project.rbac.config;

import com.project.rbac.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.filter.CorsFilter;

/**
 * Spring Security Configuration
 * 
 * Configures:
 * 1. BCrypt password encoding
 * 2. JWT + Session-based authentication
 * 3. Role-based access control
 * 4. Session management and concurrency control
 * 5. CORS configuration for cross-origin deployment
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(securedEnabled = true, jsr250Enabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final com.project.rbac.security.MfaEnforcementFilter mfaEnforcementFilter;
    private final com.project.rbac.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:5173,https://rbac-guard.vercel.app}")
    private String allowedOriginsEnv;

    /**
     * BCrypt Password Encoder Bean
     * Strength: 10 (default) - provides good security/performance balance
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
     * CSRF is disabled because:
     * - This is a stateless REST API using JWT tokens
     * - Frontend (Vercel) and Backend (Render) are on different domains
     * - CSRF cookies cannot work cross-origin without complex configuration
     * - JWT in Authorization header provides equivalent protection
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Authentication Provider
                .authenticationProvider(authenticationProvider())

                // CORS configuration
                .cors().and()

                // CSRF disabled for REST API with JWT authentication
                .csrf().disable()

                // MFA Enforcement Filter
                .addFilterAfter(mfaEnforcementFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)

                // JWT Authentication Filter
                .addFilterBefore(jwtAuthenticationFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)

                // Session Management Configuration
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation().migrateSession()
                .maximumSessions(10)
                .maxSessionsPreventsLogin(false)
                .and()
                .and()

                // Authorization Configuration
                .authorizeRequests()
                // Public endpoints - no authentication required
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/public/**").permitAll()
                .antMatchers("/").permitAll() // Root health endpoint

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
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":true,\"message\":\"Logged out successfully\"}");
                })
                .and()

                // Exception handling
                .exceptionHandling()
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized - Please login\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json");
                    response.getWriter()
                            .write("{\"success\":false,\"message\":\"Access Denied - Insufficient permissions\"}");
                });

        return http.build();
    }

    /**
     * CORS Configuration
     * Supports both local dev and cross-origin production deployment
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse allowed origins from environment variable
        if (allowedOriginsEnv != null && !allowedOriginsEnv.isEmpty()) {
            configuration.setAllowedOriginPatterns(Arrays.asList(allowedOriginsEnv.split(",")));
        } else {
            configuration.setAllowedOrigins(Arrays.asList(
                    "http://localhost:3000",
                    "http://localhost:5173"));
        }

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

    /**
     * High-priority CorsFilter bean
     * Ensures OPTIONS preflight requests get CORS headers BEFORE
     * Spring Security's filter chain can reject them with 403.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}
