package com.paywallet.app.controller;

import com.paywallet.app.dto.SendOtpRequest;
import com.paywallet.app.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Random;

/**
 * Handles OTP sending for authentication or high-value transactions.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class OtpController {

    private final SmsService smsService;
    private final Random random = new Random();

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        // Generate a random 6-digit OTP
        String otp = String.format("%06d", random.nextInt(999999));
        
        System.out.println("=================================================");
        System.out.println("[OTP Engine] Generated OTP for " + request.getPhoneNumber() + ": " + otp);
        System.out.println("=================================================");
        
        smsService.sendOtp(request.getPhoneNumber(), otp);
        
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
    }
}

