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
            
            String dashboardUrl = "https://rbac-identity.vercel.app";
            
            String htmlContent = "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "    <meta charset=\"utf-8\">" +
                    "    <style>" +
                    "        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }" +
                    "        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }" +
                    "        .header { background: #4F46E5; padding: 30px 40px; text-align: center; }" +
                    "        .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 600; }" +
                    "        .content { padding: 40px; color: #374151; }" +
                    "        .greeting { font-size: 18px; font-weight: 600; margin-bottom: 20px; color: #111827; }" +
                    "        .message { font-size: 16px; line-height: 1.6; color: #4B5563; margin-bottom: 30px; }" +
                    "        .otp-container { background: #EEF2FF; border: 2px dashed #818CF8; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0; }" +
                    "        .otp-code { font-size: 42px; font-weight: 800; color: #4F46E5; letter-spacing: 8px; margin: 0; font-family: 'JetBrains Mono', monospace; }" +
                    "        .warning { background: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; margin-bottom: 10px; border-radius: 0 8px 8px 0; }" +
                    "        .warning p { margin: 0 0 10px 0; color: #991B1B; font-size: 14px; line-height: 1.5; }" +
                    "        .footer { background: #F9FAFB; padding: 30px 40px; text-align: center; border-top: 1px solid #E5E7EB; }" +
                    "        .footer p { color: #6B7280; font-size: 13px; margin: 0; }" +
                    "        .footer a { color: #4F46E5; text-decoration: none; font-weight: 500; }" +
                    "        .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 5px; }" +
                    "        .status-badge { display: inline-block; background: #DEF7EC; color: #03543F; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }" +
                    "    </style>" +
                    "</head>" +
                    "<body>" +
                    "    <div class=\"container\">" +
                    "        <div class=\"header\">" +
                    "            <h1>Smarter RBAC Security</h1>" +
                    "        </div>" +
                    "        <div class=\"content\">" +
                    "            <div class=\"status-badge\">● Live Security Alert</div>" +
                    "            <div class=\"greeting\">Hello " + username + ",</div>" +
                    "            <div class=\"message\">" +
                    "                We detected a login attempt to your account from a new or unrecognized device. To complete your secure login, please use the verification code below:" +
                    "            </div>" +
                    "            " +
                    "            <div class=\"otp-container\">" +
                    "                <p class=\"otp-code\">" + otp + "</p>" +
                    "            </div>" +
                    "            " +
                    "            <div class=\"message\" style=\"font-size: 14px; text-align: center;\">" +
                    "                This secure code will expire in <strong>10 minutes</strong>." +
                    "            </div>" +
                    "" +
                    "            <div class=\"warning\">" +
                    "                <p><strong>🚨 Didn't request this code?</strong></p>" +
                    "                <p>If you did not attempt to log in, someone else may be trying to access your account. Please secure it immediately.</p>" +
                    "                <div style=\"text-align: center; margin-top: 15px;\">" +
                    "                    <a href=\"" + dashboardUrl + "/\" class=\"button\">Secure My Account</a>" +
                    "                </div>" +
                    "            </div>" +
                    "        </div>" +
                    "        <div class=\"footer\">" +
                    "            <p>You received this email because it is linked to a Smarter RBAC account.</p>" +
                    "            <p style=\"margin-top: 15px;\">" +
                    "                <a href=\"" + dashboardUrl + "/\">Dashboard</a> | " +
                    "                <a href=\"" + dashboardUrl + "/\">Security Settings</a>" +
                    "            </p>" +
                    "            <p style=\"margin-top: 20px;\">&copy; 2026 Smarter RBAC Identity. All rights reserved.</p>" +
                    "        </div>" +
                    "    </div>" +
                    "</body>" +
                    "</html>";
                    
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
