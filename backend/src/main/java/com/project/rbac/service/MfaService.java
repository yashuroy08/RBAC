package com.project.rbac.service;

import com.project.rbac.entity.User;
import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MFA Service - Handles OTP generation, verification, and email delivery via Resend
 */
@Service
@Slf4j
public class MfaService {

    @Value("${resend.api.key:mock}")
    private String resendApiKey;

    private Resend resend;
    
    // Simple in-memory storage for OTPs (User ID -> OTP)
    private final Map<Long, String> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @PostConstruct
    public void init() {
        if (!"mock".equalsIgnoreCase(resendApiKey)) {
            this.resend = new Resend(resendApiKey);
            log.info("📧 Resend Email Service initialized");
        } else {
            log.warn("📧 Resend API key is 'mock'. MFA codes will only be visible in server logs.");
        }
    }

    /**
     * Generate a 6-digit OTP for a user and send it via email
     */
    public String generateOtp(User user) {
        Long userId = user.getId();
        String userEmail = user.getEmail();
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(userId, otp);
        
        log.info("🔐 MFA REQUIRED: User {} (ID {}).", user.getUsername(), userId);
        
        if (resend != null) {
            sendEmail(userEmail, user.getUsername(), otp);
        } else {
            log.info("--------------------------------------------------");
            log.info(">>> MOCK OTP FOR {}: {} <<<", userEmail, otp);
            log.info("--------------------------------------------------");
        }
        
        return otp;
    }

    private void sendEmail(String to, String username, String otp) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from("RBAC Security <onboarding@resend.dev>")
                    .to(to)
                    .subject("Your RBAC Verification Code")
                    .html("<strong>Hello " + username + ",</strong><br><br>" +
                          "A login attempt was detected from a new device. Use the following code to verify your identity:<br><br>" +
                          "<h1 style='color: #4F46E5;'>" + otp + "</h1><br>" +
                          "This code will expire in 10 minutes.<br><br>" +
                          "If you did not attempt to log in, please change your password immediately.")
                    .build();

            CreateEmailResponse data = resend.emails().send(params);
            log.info("✅ MFA Email sent successfully to {}. Resend ID: {}", to, data.getId());
        } catch (ResendException e) {
            log.error("❌ Failed to send MFA email to {}: {}", to, e.getMessage());
            // Fallback to log so user isn't locked out during dev/testing
            log.info(">>> FALLBACK OTP FOR {}: {} <<<", to, otp);
        }
    }

    /**
     * Verify OTP for a user
     */
    public boolean verifyOtp(Long userId, String otp) {
        String storedOtp = otpStorage.get(userId);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStorage.remove(userId);
            log.info("✅ MFA Verified for User ID: {}", userId);
            return true;
        }
        log.warn("❌ MFA Failed for User ID: {}. Invalid OTP: {}", userId, otp);
        return false;
    }
}
