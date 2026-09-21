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
 * Handles user registration, lookup, and profile operations.
 * <p>
 * On registration, a default {@code USER} role is assigned and an empty
 * {@link Wallet} is automatically created and linked.
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
     *
     * @param request validated registration payload
     * @return the created user as a response DTO
     * @throws IllegalArgumentException      if email or phone is already taken
     * @throws ResourceNotFoundException     if the default role does not exist
     */
    @Transactional
    public UserResponse registerUser(UserRegistrationRequest request) {
        // ── Uniqueness checks ───────────────────────────────────────────
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number is already registered: " + request.getPhone());
        }

        // ── Resolve default role ────────────────────────────────────────
        Role role = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", DEFAULT_ROLE));

        // ── Build & persist user ────────────────────────────────────────
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // ── Auto-create empty wallet ────────────────────────────────────
        Wallet wallet = Wallet.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        walletRepository.save(wallet);

        // ── Return response ─────────────────────────────────────────────
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

    // ── Mapping helper ──────────────────────────────────────────────────

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

