package com.paywallet.app.controller;

import com.paywallet.app.dto.PinSetupRequest;
import com.paywallet.app.dto.PinUpdateRequest;
import com.paywallet.app.dto.UserResponse;
import com.paywallet.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * User profile and security management endpoints.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Retrieves the profile of a user.
     */
    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserResponse> getUserProfile(@PathVariable Long userId) {
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    /**
     * Initial 4-digit transaction PIN setup.
     */
    @PostMapping("/{userId}/pin/setup")
    public ResponseEntity<Map<String, String>> setupPin(
            @PathVariable Long userId,
            @Valid @RequestBody PinSetupRequest request) {
        userService.setupPin(userId, request.getPin());
        return ResponseEntity.ok(Map.of("message", "Transaction PIN configured successfully"));
    }

    /**
     * Updates an existing 4-digit transaction PIN.
     */
    @PostMapping("/{userId}/pin/update")
    public ResponseEntity<Map<String, String>> updatePin(
            @PathVariable Long userId,
            @Valid @RequestBody PinUpdateRequest request) {
        userService.updatePin(userId, request.getCurrentPin(), request.getNewPin());
        return ResponseEntity.ok(Map.of("message", "Transaction PIN updated successfully"));
    }
}
