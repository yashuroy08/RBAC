package com.project.rbac;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;

/**
 * RBAC Risk Evaluator System
 * 
 * Main Application Class
 * 
 * Project: Design and Development of a Secure Role-Based Access Control System
 * using Spring Framework and BCrypt Password Hashing
 * with Integrated Risk Evaluation Mechanism
 * 
 * Features:
 * - Session-based authentication
 * - BCrypt password hashing
 * - Role-Based Access Control (ADMIN, USER)
 * - Risk Evaluation with automatic session invalidation
 * - Session tracking and monitoring
 * - MS SQL Server database
 * 
 * @author Final Year Project
 * @version 1.0.0
 */
@SpringBootApplication
@EnableJdbcHttpSession
public class RbacRiskEvaluatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(RbacRiskEvaluatorApplication.class, args);

        System.out.println("\n" +
                "=============================================================\n" +
                "  RBAC RISK EVALUATOR SYSTEM - STARTED SUCCESSFULLY\n" +
                "=============================================================\n" +
                "  Application: RBAC with Risk Evaluation Mechanism\n" +
                "  Port: 8080\n" +
                "  Swagger UI: http://localhost:8080/swagger-ui/\n" +
                "  API Docs: http://localhost:8080/v2/api-docs\n" +
                "=============================================================\n" +
                "  Security Features:\n" +
                "  ✓ BCrypt Password Hashing\n" +
                "  ✓ Session-Based Authentication\n" +
                "  ✓ Role-Based Access Control\n" +
                "  ✓ Risk Evaluation System\n" +
                "  ✓ Automatic Session Invalidation\n" +
                "=============================================================\n");
    }
}
