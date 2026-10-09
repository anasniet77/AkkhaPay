package com.paywallet.app.service;

import com.paywallet.app.dto.UserRegistrationRequest;
import com.paywallet.app.dto.UserResponse;
import com.paywallet.app.entity.Role;
import com.paywallet.app.entity.User;
import com.paywallet.app.entity.Wallet;
import com.paywallet.app.entity.WalletStatus;
import com.paywallet.app.exception.ResourceNotFoundException;
import com.paywallet.app.repository.RoleRepository;
import com.paywallet.app.repository.UserRepository;
import com.paywallet.app.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Handles user registration, lookup, profile, and security PIN operations.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new user, hashes their password, assigns the default role,
     * and creates an empty wallet linked to the user.
     */
    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number is already registered: " + request.getPhone());
        }

        Role role = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", DEFAULT_ROLE));

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        walletRepository.save(wallet);

        return toResponse(user);
    }

    /**
     * Looks up a user by ID.
     */
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return toResponse(user);
    }

    /**
     * Looks up a user by email.
     */
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return toResponse(user);
    }

    /**
     * Sets up a new 4-digit transaction PIN for the user.
     */
    @Transactional
    public void setupPin(Long userId, String pin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getPinHash() != null) {
            throw new IllegalArgumentException("Transaction PIN has already been configured. Use PIN update instead.");
        }

        user.setPinHash(passwordEncoder.encode(pin));
        userRepository.save(user);
    }

    /**
     * Updates an existing 4-digit transaction PIN.
     */
    @Transactional
    public void updatePin(Long userId, String currentPin, String newPin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getPinHash() == null) {
            throw new IllegalArgumentException("Transaction PIN has not been set yet. Please set up a PIN first.");
        }

        if (!passwordEncoder.matches(currentPin, user.getPinHash())) {
            throw new IllegalArgumentException("Current transaction PIN is incorrect.");
        }

        user.setPinHash(passwordEncoder.encode(newPin));
        userRepository.save(user);
    }

    /**
     * Verifies that the provided PIN matches the user's configured PIN.
     */
    public void verifyPin(Long userId, String pin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getPinHash() == null) {
            throw new IllegalArgumentException("You must set up a transaction PIN before performing transfers.");
        }

        if (!passwordEncoder.matches(pin, user.getPinHash())) {
            throw new IllegalArgumentException("Invalid transaction PIN.");
        }
    }

    // ── Mapping helper ──────────────────────────────────────────────────

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .isActive(user.getIsActive())
                .hasPinSet(user.getPinHash() != null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
