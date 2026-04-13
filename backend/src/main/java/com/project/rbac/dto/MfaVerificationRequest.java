package com.project.rbac.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;

@Data
public class MfaVerificationRequest {
    @NotBlank
    private String otp;
    
    @NotBlank
    private String sessionId;
}
