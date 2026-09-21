package com.paywallet.app.service;

/**
 * Abstraction over an SMS provider (Twilio, AWS SNS, etc.).
 * <p>
 * Implementations can be swapped without changing consumers.
 */
public interface SmsService {

    /**
     * Sends an OTP via SMS.
     *
     * @param phoneNumber the recipient phone number (E.164 format)
     * @param otp         the one-time password string
     */
    void sendOtp(String phoneNumber, String otp);
}

