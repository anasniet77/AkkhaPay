package com.paywallet.app.service;

import com.paywallet.app.dto.TransactionResponse;
import com.paywallet.app.entity.Transaction;
import com.paywallet.app.entity.TransactionStatus;
import com.paywallet.app.entity.TransactionType;
import com.paywallet.app.entity.Wallet;
import com.paywallet.app.exception.InsufficientBalanceException;
import com.paywallet.app.exception.ResourceNotFoundException;
import com.paywallet.app.repository.TransactionRepository;
import com.paywallet.app.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
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
public class TransactionService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Transfers funds from one wallet to another within a single DB transaction.
     * <ol>
     *   <li>Validates the transfer amount is positive.</li>
     *   <li>Loads sender and receiver wallets.</li>
     *   <li>Checks the sender has sufficient balance ({@code compareTo}).</li>
     *   <li>Deducts from sender, adds to receiver, and saves both wallets.</li>
     *   <li>Records a {@link Transaction} with status {@code SUCCESS}.</li>
     * </ol>
     *
     * @param senderId   the sender's wallet ID
     * @param receiverId the receiver's wallet ID
     * @param amount     the transfer amount (must be positive)
     * @return the completed transaction as a response DTO
     * @throws IllegalArgumentException      if amount is zero/negative or sender == receiver
     * @throws ResourceNotFoundException     if either wallet does not exist
     * @throws InsufficientBalanceException  if sender's balance is too low
     */
    @Transactional
    public TransactionResponse transferFunds(Long senderId, Long receiverId, BigDecimal amount) {
        // ── Validation ──────────────────────────────────────────────────
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Sender and receiver wallets must be different");
        }

        // ── Load wallets ────────────────────────────────────────────────
        Wallet senderWallet = walletRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", senderId));

        Wallet receiverWallet = walletRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", receiverId));

        // ── Balance check (BigDecimal.compareTo — never == / equals) ───
        if (senderWallet.getBalance().compareTo(amount) < 0) {
            throw new InsufficientBalanceException(senderWallet.getBalance(), amount);
        }

        // ── Execute transfer ────────────────────────────────────────────
        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // ── Record transaction ──────────────────────────────────────────
        Transaction transaction = Transaction.builder()
                .senderWalletId(senderId)
                .receiverWalletId(receiverId)
                .amount(amount)
                .transactionType(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .referenceNumber(generateReferenceNumber())
                .build();

        transaction = transactionRepository.save(transaction);

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
     * Transfers funds between two users' wallets (resolves user IDs → wallet IDs).
     *
     * @param senderUserId   the sender user's ID
     * @param receiverUserId the receiver user's ID
     * @param amount         the transfer amount (must be positive)
     * @return the completed transaction as a response DTO
     */
    @Transactional
    public TransactionResponse transferFundsByUserId(Long senderUserId, Long receiverUserId, BigDecimal amount) {
        if (senderUserId.equals(receiverUserId)) {
            throw new IllegalArgumentException("Sender and receiver must be different users");
        }

        Wallet senderWallet = walletRepository.findByUserId(senderUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", senderUserId));

        Wallet receiverWallet = walletRepository.findByUserId(receiverUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", receiverUserId));

        return transferFunds(senderWallet.getId(), receiverWallet.getId(), amount);
    }

    /**
     * Returns all transactions for a given user (resolves user ID → wallet ID).
     *
     * @param userId the user's ID
     * @return list of transaction response DTOs
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

