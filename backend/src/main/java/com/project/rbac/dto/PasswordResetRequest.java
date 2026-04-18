package com.project.rbac.dto;

import lombok.Data;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * Password Reset Request DTO
 * Validation aligned with RegistrationRequest standards.
 */
@Data
public class PasswordResetRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Pattern(
            regexp = "^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$",
            message = "Email format is invalid. Example: user@example.com"
    )
    private String email;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String newPassword;
}
