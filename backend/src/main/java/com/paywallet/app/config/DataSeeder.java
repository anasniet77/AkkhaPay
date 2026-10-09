package com.paywallet.app.config;

import com.paywallet.app.entity.Role;
import com.paywallet.app.entity.User;
import com.paywallet.app.entity.Wallet;
import com.paywallet.app.entity.WalletStatus;
import com.paywallet.app.repository.RoleRepository;
import com.paywallet.app.repository.UserRepository;
import com.paywallet.app.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Seeds a demo admin user on application startup if one does not already exist.
 * <p>
 * Credentials: admin@paywallet.com / admin123 | PIN: 1234
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // If admin exists, ensure default PIN is configured
        if (userRepository.existsByEmail("admin@paywallet.com")) {
            userRepository.findByEmail("admin@paywallet.com").ifPresent(admin -> {
                if (admin.getPinHash() == null) {
                    admin.setPinHash(passwordEncoder.encode("1234"));
                    userRepository.save(admin);
                }
            });
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName("ADMIN");
                    return roleRepository.save(role);
                });

        User admin = User.builder()
                .fullName("Admin Demo")
                .email("admin@paywallet.com")
                .phone("+919999999999")
                .passwordHash(passwordEncoder.encode("admin123"))
                .pinHash(passwordEncoder.encode("1234"))
                .role(adminRole)
                .isActive(true)
                .build();

        admin = userRepository.save(admin);

        Wallet wallet = Wallet.builder()
                .user(admin)
                .balance(new BigDecimal("10000.0000"))
                .currency("INR")
                .status(WalletStatus.ACTIVE)
                .build();

        walletRepository.save(wallet);

        System.out.println("=================================================");
        System.out.println("[DataSeeder] Demo admin created:");
        System.out.println("  Email:    admin@paywallet.com");
        System.out.println("  Password: admin123");
        System.out.println("  PIN:      1234");
        System.out.println("  Balance:  INR 10,000.00");
        System.out.println("=================================================");
    }
}
