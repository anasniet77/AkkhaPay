package com.paywallet.app.service;

import com.paywallet.app.dto.WalletResponse;
import com.paywallet.app.entity.Transaction;
import com.paywallet.app.entity.TransactionStatus;
import com.paywallet.app.entity.TransactionType;
import com.paywallet.app.entity.Wallet;
import com.paywallet.app.exception.ResourceNotFoundException;
import com.paywallet.app.repository.TransactionRepository;
import com.paywallet.app.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Handles wallet balance inquiries, details, and deposits.
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Returns the wallet details for a given user.
     *
     * @param userId the user's ID
     * @return wallet response DTO
     * @throws ResourceNotFoundException if no wallet is found for the user
     */
    public WalletResponse getWalletByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));
        return toResponse(wallet);
    }

    /**
     * Returns the wallet details by wallet ID.
     *
     * @param walletId the wallet's ID
     * @return wallet response DTO
     * @throws ResourceNotFoundException if no wallet is found
     */
    public WalletResponse getWalletById(Long walletId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
        return toResponse(wallet);
    }

    /**
     * Adds funds to a user's wallet via an external payment.
     *
     * @param userId the user's ID
     * @param amount the amount to add
     */
    @Transactional
    public void addFunds(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        // Update balance
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        // Record deposit transaction
        Transaction transaction = Transaction.builder()
                .amount(amount)
                .receiverWalletId(wallet.getId())
                .transactionType(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .referenceNumber("DEP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase())
                .build();
        
        transactionRepository.save(transaction);
    }

    // ── Mapping helper ──────────────────────────────────────────────────

    private WalletResponse toResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUser().getId())
                .balance(wallet.getBalance())
                .currency(wallet.getCurrency())
                .status(wallet.getStatus().name())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}

