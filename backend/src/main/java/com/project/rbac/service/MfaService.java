package com.project.rbac.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * MFA Service - Handles mock OTP generation and verification
 */
@Service
@Slf4j
public class MfaService {

    // Simple in-memory storage for OTPs (User ID -> OTP)
    // In production, use Redis or a database with expiration
    private final Map<Long, String> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Generate a 6-digit OTP for a user
     */
    public String generateOtp(Long userId) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(userId, otp);
        
        log.info("🔐 MFA REQUIRED: User ID {}. MOCK OTP: {}", userId, otp);
        log.info("--------------------------------------------------");
        log.info(">>> YOUR OTP IS: {} <<<", otp);
        log.info("--------------------------------------------------");
        
        return otp;
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
