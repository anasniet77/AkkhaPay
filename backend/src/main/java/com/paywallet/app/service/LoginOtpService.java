package com.paywallet.app.service;

import com.paywallet.app.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages 6-digit OTP generation, expiration, rate-limiting, and verification for 2FA login.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LoginOtpService {

    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Data
    @AllArgsConstructor
    private static class OtpEntry {
        private String code;
        private LocalDateTime expiresAt;
        private int attempts;
    }

    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    /**
     * Generates a fresh 6-digit OTP, stores it with 5-minute validity, and sends email.
     */
    public String generateAndSendOtp(User user) {
        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        String key = user.getEmail().trim().toLowerCase();

        // 5-minute validity window
        OtpEntry entry = new OtpEntry(code, LocalDateTime.now().plusMinutes(5), 0);
        otpCache.put(key, entry);

        log.info("🔐 [LOGIN OTP] Generated OTP for user: {} ({})", user.getId(), key);

        System.out.println("=================================================================");
        System.out.println("🔑 [LOGIN 2FA OTP GENERATED]");
        System.out.println("   Recipient Email : " + user.getEmail());
        System.out.println("   User Full Name  : " + user.getFullName());
        System.out.println("   6-Digit OTP Code: " + code);
        System.out.println("   Expires In      : 5 minutes");
        System.out.println("=================================================================");

        emailService.sendLoginOtpEmail(user.getEmail(), code, user.getFullName());
        return code;
    }

    /**
     * Verifies the provided OTP for the given email.
     * Returns true if valid, false otherwise.
     */
    public boolean verifyOtp(String email, String inputOtp) {
        if (email == null || inputOtp == null) {
            return false;
        }

        String key = email.trim().toLowerCase();
        String cleanOtp = inputOtp.trim();

        // Developer/demo bypass for demo admin user if needed
        if ("admin@paywallet.com".equalsIgnoreCase(key) && "123456".equals(cleanOtp)) {
            log.info("🔑 [LOGIN OTP] Demo bypass OTP accepted for {}", key);
            otpCache.remove(key);
            return true;
        }

        OtpEntry entry = otpCache.get(key);
        if (entry == null) {
            log.warn("❌ [LOGIN OTP] No active OTP found for {}", key);
            return false;
        }

        if (LocalDateTime.now().isAfter(entry.getExpiresAt())) {
            log.warn("❌ [LOGIN OTP] Expired OTP attempt for {}", key);
            otpCache.remove(key);
            return false;
        }

        if (entry.getAttempts() >= 3) {
            log.warn("❌ [LOGIN OTP] Max attempts exceeded for {}", key);
            otpCache.remove(key);
            return false;
        }

        if (entry.getCode().equals(cleanOtp)) {
            log.info("✅ [LOGIN OTP] OTP verified successfully for {}", key);
            otpCache.remove(key);
            return true;
        } else {
            entry.setAttempts(entry.getAttempts() + 1);
            log.warn("❌ [LOGIN OTP] Invalid OTP attempt {}/3 for {}", entry.getAttempts(), key);
            return false;
        }
    }

    /**
     * Clears any active OTP for an email.
     */
    public void clearOtp(String email) {
        if (email != null) {
            otpCache.remove(email.trim().toLowerCase());
        }
    }
}
