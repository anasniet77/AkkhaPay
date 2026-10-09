package com.paywallet.app.controller;

import com.paywallet.app.dto.AuthResponse;
import com.paywallet.app.dto.LoginRequest;
import com.paywallet.app.dto.ResendOtpRequest;
import com.paywallet.app.dto.UserRegistrationRequest;
import com.paywallet.app.dto.UserResponse;
import com.paywallet.app.dto.VerifyLoginOtpRequest;
import com.paywallet.app.entity.User;
import com.paywallet.app.exception.ResourceNotFoundException;
import com.paywallet.app.repository.UserRepository;
import com.paywallet.app.security.CustomUserDetailsService;
import com.paywallet.app.security.JwtUtil;
import com.paywallet.app.service.LoginOtpService;
import com.paywallet.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Authentication endpoints — register, login with 2FA email OTP, and OTP verification.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final LoginOtpService loginOtpService;
    private final CustomUserDetailsService userDetailsService;

    /**
     * Registers a new user and auto-creates an empty wallet.
     *
     * @param request validated registration payload
     * @return 201 Created with the new user details
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        UserResponse response = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Validates credentials and dispatches a 6-digit OTP code to the registered Gmail.
     *
     * @param request login payload (email + password)
     * @return 200 OK with otpRequired=true and masked email
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        // ── 1. Authenticate email & password ────────────────────────────
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // ── 2. Resolve user ─────────────────────────────────────────────
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // ── 3. Generate & dispatch 6-digit OTP to user's registered email 
        loginOtpService.generateAndSendOtp(user);

        AuthResponse response = AuthResponse.builder()
                .otpRequired(true)
                .email(user.getEmail())
                .maskedEmail(maskEmail(user.getEmail()))
                .message("A 6-digit verification code has been sent to your registered email.")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Verifies the 6-digit OTP and generates the JWT bearer token.
     */
    @PostMapping("/verify-login-otp")
    public ResponseEntity<AuthResponse> verifyLoginOtp(@Valid @RequestBody VerifyLoginOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        boolean isValid = loginOtpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!isValid) {
            return ResponseEntity.badRequest().body(
                    AuthResponse.builder()
                            .otpRequired(true)
                            .email(request.getEmail())
                            .message("Invalid or expired 6-digit OTP verification code.")
                            .build()
            );
        }

        // ── Generate JWT token ──────────────────────────────────────────
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        AuthResponse response = AuthResponse.builder()
                .otpRequired(false)
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .hasPinSet(user.getPinHash() != null)
                .message("Login verified successfully.")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Re-dispatches a fresh 6-digit OTP to the user's email.
     */
    @PostMapping("/resend-login-otp")
    public ResponseEntity<Map<String, Object>> resendLoginOtp(@Valid @RequestBody ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        loginOtpService.generateAndSendOtp(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "A new 6-digit OTP code has been sent to " + maskEmail(user.getEmail())
        ));
    }

    /**
     * Liveness and health check endpoint for monitoring and cloud deployment platforms.
     */
    @org.springframework.web.bind.annotation.GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "app", "AkhhaPAY",
                "timestamp", System.currentTimeMillis()
        ));
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String name = parts[0];
        String domain = parts[1];
        if (name.length() <= 2) {
            return name.charAt(0) + "***@" + domain;
        }
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + domain;
    }
}
