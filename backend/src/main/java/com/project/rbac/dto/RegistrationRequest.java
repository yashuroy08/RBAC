package com.project.rbac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * Registration Request DTO
 * Used for new user registration
 *
 * Validation rules (industry-standard):
 *  - Username: 3–50 chars, alphanumeric + underscore/dot/hyphen, must start with a letter
 *  - Email:    RFC 5322 simplified pattern, max 100 chars
 *  - Password: 8–100 chars, requires uppercase, lowercase, digit, and special character
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(
            regexp = "^[a-zA-Z][a-zA-Z0-9._-]{2,49}$",
            message = "Username must start with a letter and can only contain letters, numbers, dots, underscores, or hyphens"
    )
    private String username;

    @NotBlank(message = "Email is required")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Email(message = "Email must be valid")
    @Pattern(
            regexp = "^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$",
            message = "Email format is invalid. Example: user@example.com"
    )
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String password;

}
