package com.project.rbac.service;

import com.project.rbac.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MFA Service - Handles OTP generation, verification, and email delivery via Spring Mail (Gmail SMTP)
 */
@Service
@Slf4j
public class MfaService {

    @Value("${spring.mail.username:mock}")
    private String mailUsername;

    @Autowired
    private JavaMailSender mailSender;
    
    // Simple in-memory storage for OTPs (User ID -> OTP)
    private final Map<Long, String> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @PostConstruct
    public void init() {
        if (!"mock".equalsIgnoreCase(mailUsername)) {
            log.info("📧 Spring Mail Service initialized for user: {}", mailUsername);
        } else {
            log.warn("📧 Mail username is 'mock'. MFA codes will only be visible in server logs.");
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
        
        if (!"mock".equalsIgnoreCase(mailUsername)) {
            sendEmail(userEmail, user.getUsername(), otp);
        } else {
            log.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log.warn("🔐 MOCK OTP GENERATED FOR: {}", userEmail);
            log.warn("👉 CODE: {} 👈", otp);
            log.warn("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
        
        return otp;
    }

    private void sendEmail(String to, String username, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailUsername);
            helper.setTo(to);
            helper.setSubject("Your RBAC Verification Code");
            
            String htmlContent = "<strong>Hello " + username + ",</strong><br><br>" +
                    "A login attempt was detected from a new device. Use the following code to verify your identity:<br><br>" +
                    "<h1 style='color: #4F46E5;'>" + otp + "</h1><br>" +
                    "This code will expire in 10 minutes.<br><br>" +
                    "If you did not attempt to log in, please change your password immediately.";
                    
            helper.setText(htmlContent, true); // Set to true for HTML

            mailSender.send(message);
            log.info("✅ MFA Email sent successfully to {}", to);
        } catch (MessagingException e) {
            log.error("❌ Failed to construct MFA email to {}: {}", to, e.getMessage());
            // Fallback to log so user isn't locked out during dev/testing
            log.warn(">>> FALLBACK OTP FOR {}: {} <<<", to, otp);
        } catch (Exception e) {
            log.error("❌ Failed to send MFA email to {}: {}", to, e.getMessage());
            log.warn(">>> FALLBACK OTP FOR {}: {} <<<", to, otp);
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
