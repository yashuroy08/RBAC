package com.project.rbac.exception;

import com.project.rbac.dto.ApiResponse;
import com.project.rbac.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Global Exception Handler
 * Handles all exceptions across the application
 * Automatically pipes security and crash events to the Audit Logging Service.
 */
@RestControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final AuditLogService auditLogService;

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) ? auth.getName() : "SYSTEM";
    }

    private String getStackTraceTail(Exception ex) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        ex.printStackTrace(pw);
        String trace = sw.toString();
        // Shorten stack trace for database storage
        return trace.length() > 600 ? trace.substring(0, 597) + "..." : trace;
    }
    
    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.error("Validation error: {}", errors);
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", errors));
    }
    
    /**
     * Handle authentication errors
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse> handleAuthenticationException(AuthenticationException ex) {
        log.error("Authentication error: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication failed: " + ex.getMessage()));
    }
    
    /**
     * Handle bad credentials
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.error("Bad credentials: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid username or password"));
    }
    
    /**
     * Handle access denied (authorization errors)
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse> handleAccessDeniedException(AccessDeniedException ex) {
        String actor = getCurrentUsername();
        String metadata = "{\"error\": \"" + ex.getMessage().replace("\"", "\\\"") + "\"}";
        
        auditLogService.logEvent("SECURITY", "ACCESS_DENIED", "WARNING", actor, null, 
                "Unauthorized access attempt detected: " + ex.getMessage(), metadata, "FAILURE");

        log.error("Access denied: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Access denied: " + ex.getMessage()));
    }
    
    /**
     * Handle runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntimeException(RuntimeException ex) {
        String actor = getCurrentUsername();
        String trace = getStackTraceTail(ex).replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
        String metadata = "{\"error\": \"" + ex.getMessage().replace("\"", "\\\"") + "\", \"stackTrace\": \"" + trace + "\"}";
        
        auditLogService.logEvent("SYSTEM", "RUNTIME_ERROR", "ERROR", actor, null, 
                "Uncaught RuntimeException in system", metadata, "FAILURE");

        log.error("Runtime error: {}", ex.getMessage(), ex);
        
        // Hardmasking: Send generic message to user, detailed message stays in Audit Log
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("A system error occurred. Our engineers have been notified. Reference: " + actor));
    }
    
    /**
     * Handle all other exceptions (500 Internal Server Errors)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGlobalException(Exception ex) {
        String actor = getCurrentUsername();
        String trace = getStackTraceTail(ex).replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
        String metadata = "{\"error\": \"" + ex.getMessage().replace("\"", "\\\"") + "\", \"stackTrace\": \"" + trace + "\"}";
        
        auditLogService.logEvent("SYSTEM", "SYSTEM_CRASH", "CRITICAL", actor, null, 
                "Uncaught Internal Server Error (500)", metadata, "FAILURE");

        log.error("Unexpected error: {}", ex.getMessage(), ex);
        
        // Hardmasking: Protect system internals by sending a generic 500 message
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An internal security or system error occurred. Please try again later."));
    }
}
