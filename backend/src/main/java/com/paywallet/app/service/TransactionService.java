package com.paywallet.app.service;

import com.paywallet.app.dto.TransactionResponse;
import com.paywallet.app.entity.Transaction;
import com.paywallet.app.entity.TransactionStatus;
import com.paywallet.app.entity.TransactionType;
import com.paywallet.app.entity.User;
import com.paywallet.app.entity.Wallet;
import com.paywallet.app.exception.InsufficientBalanceException;
import com.paywallet.app.exception.ResourceNotFoundException;
import com.paywallet.app.repository.TransactionRepository;
import com.paywallet.app.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handles wallet-to-wallet fund transfers and transaction history.
 * <p>
 * All monetary comparisons use {@link BigDecimal#compareTo} — never
 * floating-point equality checks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserService userService;
    private final EmailService emailService;

    /**
     * Transfers funds from one wallet to another within a single DB transaction.
     */
    @Transactional
    public TransactionResponse transferFunds(Long senderId, Long receiverId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Sender and receiver wallets must be different");
        }

        Wallet senderWallet = walletRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", senderId));

        Wallet receiverWallet = walletRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", receiverId));

        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(senderWallet.getBalance(), amount);
        }

        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        Transaction transaction = Transaction.builder()
                .senderWalletId(senderId)
                .receiverWalletId(receiverId)
                .amount(amount)
                .transactionType(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .referenceNumber(generateReferenceNumber())
                .build();

        transaction = transactionRepository.save(transaction);

        // ── Dispatch Email Transaction Alerts ───────────────────────────
        try {
            User senderUser = senderWallet.getUser();
            User receiverUser = receiverWallet.getUser();

            if (senderUser != null && senderUser.getEmail() != null) {
                String receiverName = (receiverUser != null && receiverUser.getFullName() != null)
                        ? receiverUser.getFullName() : "Wallet #" + receiverId;
                emailService.sendDebitAlert(
                        senderUser.getEmail(),
                        senderUser.getFullName(),
                        amount,
                        transaction.getReferenceNumber(),
                        senderWallet.getBalance(),
                        receiverName
                );
            }

            if (receiverUser != null && receiverUser.getEmail() != null) {
                String senderName = (senderUser != null && senderUser.getFullName() != null)
                        ? senderUser.getFullName() : "Wallet #" + senderId;
                emailService.sendCreditAlert(
                        receiverUser.getEmail(),
                        receiverUser.getFullName(),
                        amount,
                        transaction.getReferenceNumber(),
                        receiverWallet.getBalance(),
                        senderName
                );
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to dispatch transaction notification emails: {}", e.getMessage());
        }

        return toResponse(transaction);
    }

    /**
     * Returns all transactions where the given wallet is either sender or receiver.
     */
    public List<TransactionResponse> getTransactionsByWalletId(Long walletId) {
        return transactionRepository
                .findBySenderWalletIdOrReceiverWalletId(walletId, walletId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Transfers funds between two users' wallets with mandatory PIN authentication.
     */
    @Transactional
    public TransactionResponse transferFundsByUserId(Long senderUserId, Long receiverUserId, BigDecimal amount, String pin) {
        if (senderUserId.equals(receiverUserId)) {
            throw new IllegalArgumentException("Sender and receiver must be different users");
        }

        // ── Strictly verify 4-digit PIN ─────────────────────────────────
        userService.verifyPin(senderUserId, pin);

        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", senderUserId));

        Wallet receiverWallet = walletRepository.findByUserId(receiverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", receiverUserId));

        return transferFunds(senderWallet.getId(), receiverWallet.getId(), amount);
    }

    /**
     * Returns all transactions for a given user.
     */
    public List<TransactionResponse> getTransactionsByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", userId));

        return getTransactionsByWalletId(wallet.getId());
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private String generateReferenceNumber() {
        return "TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    private TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .senderWalletId(tx.getSenderWalletId())
                .receiverWalletId(tx.getReceiverWalletId())
                .amount(tx.getAmount())
                .transactionType(tx.getTransactionType().name())
                .status(tx.getStatus().name())
                .referenceNumber(tx.getReferenceNumber())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
