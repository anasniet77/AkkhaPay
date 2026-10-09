package com.paywallet.app.service;

import com.paywallet.app.dto.BillPaymentRequest;
import com.paywallet.app.dto.RazorpayTransferRequest;
import com.paywallet.app.dto.RechargeRequest;
import com.paywallet.app.entity.Transaction;
import com.paywallet.app.entity.TransactionStatus;
import com.paywallet.app.entity.TransactionType;
import com.paywallet.app.entity.User;
import com.paywallet.app.entity.Wallet;
import com.paywallet.app.exception.InsufficientBalanceException;
import com.paywallet.app.exception.ResourceNotFoundException;
import com.paywallet.app.repository.TransactionRepository;
import com.paywallet.app.repository.UserRepository;
import com.paywallet.app.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Handles utility services including mobile recharges, bill payments,
 * and Razorpay-powered instant transfers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UtilityService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final EmailService emailService;
    private final PaymentGatewayService paymentGatewayService;

    /**
     * Executes a prepaid or postpaid mobile recharge.
     */
    @Transactional
    public Map<String, Object> processMobileRecharge(RechargeRequest request) {
        // 1. Verify 4-digit PIN
        userService.verifyPin(request.getUserId(), request.getPin());

        // 2. Fetch Wallet
        Wallet wallet = walletRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", request.getUserId()));

        // 3. Check Balance
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(wallet.getBalance(), request.getAmount());
        }

        // 4. Deduct balance
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        // 5. Create Transaction Record
        String ref = "RCH-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        Transaction transaction = Transaction.builder()
                .senderWalletId(wallet.getId())
                .receiverWalletId(null)
                .amount(request.getAmount())
                .transactionType(TransactionType.RECHARGE)
                .status(TransactionStatus.SUCCESS)
                .referenceNumber(ref)
                .build();
        transactionRepository.save(transaction);

        // 6. Send Email Confirmation Alert
        User user = wallet.getUser();
        if (user != null && user.getEmail() != null) {
            emailService.sendRechargeAlert(
                    user.getEmail(),
                    user.getFullName(),
                    request.getMobileNumber(),
                    request.getOperator(),
                    request.getAmount(),
                    ref,
                    wallet.getBalance()
            );
        }

        log.info("📱 [RECHARGE] Processed ₹{} for {} ({}) - Ref: {}",
                request.getAmount(), request.getMobileNumber(), request.getOperator(), ref);

        return Map.of(
                "success", true,
                "message", "Mobile recharge of ₹" + request.getAmount() + " processed successfully",
                "referenceNumber", ref,
                "operator", request.getOperator(),
                "mobileNumber", request.getMobileNumber(),
                "newBalance", wallet.getBalance()
        );
    }

    /**
     * Executes utility bill payments (Electricity, Water, Gas, etc.).
     */
    @Transactional
    public Map<String, Object> processBillPayment(BillPaymentRequest request) {
        // 1. Verify 4-digit PIN
        userService.verifyPin(request.getUserId(), request.getPin());

        // 2. Fetch Wallet
        Wallet wallet = walletRepository.findByUserId(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", request.getUserId()));

        // 3. Check Balance
        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(wallet.getBalance(), request.getAmount());
        }

        // 4. Deduct balance
        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        // 5. Create Transaction Record
        String ref = "BILL-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        Transaction transaction = Transaction.builder()
                .senderWalletId(wallet.getId())
                .receiverWalletId(null)
                .amount(request.getAmount())
                .transactionType(TransactionType.BILL_PAYMENT)
                .status(TransactionStatus.SUCCESS)
                .referenceNumber(ref)
                .build();
        transactionRepository.save(transaction);

        // 6. Send Email Confirmation Alert
        User user = wallet.getUser();
        if (user != null && user.getEmail() != null) {
            emailService.sendBillPaymentAlert(
                    user.getEmail(),
                    user.getFullName(),
                    request.getCategory(),
                    request.getBillerName(),
                    request.getConsumerNumber(),
                    request.getAmount(),
                    ref,
                    wallet.getBalance()
            );
        }

        log.info("💡 [BILL PAYMENT] Processed ₹{} for {} ({}) - Ref: {}",
                request.getAmount(), request.getBillerName(), request.getConsumerNumber(), ref);

        return Map.of(
                "success", true,
                "message", request.getCategory() + " bill payment of ₹" + request.getAmount() + " completed successfully",
                "referenceNumber", ref,
                "billerName", request.getBillerName(),
                "consumerNumber", request.getConsumerNumber(),
                "newBalance", wallet.getBalance()
        );
    }

    /**
     * Executes transfer funded directly via Razorpay Gateway to recipient wallet.
     */
    @Transactional
    public Map<String, Object> processRazorpayTransfer(RazorpayTransferRequest request) {
        // 1. Verify Razorpay Payment Signature
        boolean isValid = paymentGatewayService.verifyPayment(
                request.getOrderId(),
                request.getPaymentId(),
                request.getSignature()
        );

        if (!isValid) {
            throw new IllegalArgumentException("Razorpay payment signature verification failed");
        }

        // 2. Find sender user, sender wallet, and recipient wallet
        User senderUser = userRepository.findById(request.getSenderUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getSenderUserId()));

        Wallet senderWallet = walletRepository.findByUserId(request.getSenderUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", request.getSenderUserId()));

        Wallet receiverWallet = walletRepository.findByUserId(request.getReceiverUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "userId", request.getReceiverUserId()));

        // Verify sender wallet has sufficient funds
        if (senderWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientBalanceException(senderWallet.getBalance(), request.getAmount());
        }

        // 3. Deduct sender wallet & Credit receiver wallet
        senderWallet.setBalance(senderWallet.getBalance().subtract(request.getAmount()));
        receiverWallet.setBalance(receiverWallet.getBalance().add(request.getAmount()));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // 4. Save transaction record linking both wallets
        String ref = "RPAY-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        Transaction transaction = Transaction.builder()
                .senderWalletId(senderWallet.getId())
                .receiverWalletId(receiverWallet.getId())
                .amount(request.getAmount())
                .transactionType(TransactionType.TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .referenceNumber(ref)
                .build();
        transactionRepository.save(transaction);

        // 5. Send alerts to both parties
        User receiverUser = receiverWallet.getUser();
        if (receiverUser != null && receiverUser.getEmail() != null) {
            emailService.sendCreditAlert(
                    receiverUser.getEmail(),
                    receiverUser.getFullName(),
                    request.getAmount(),
                    ref,
                    receiverWallet.getBalance(),
                    senderUser.getFullName() + " (via Razorpay)"
            );
        }

        if (senderUser.getEmail() != null) {
            emailService.sendDebitAlert(
                    senderUser.getEmail(),
                    senderUser.getFullName(),
                    request.getAmount(),
                    ref,
                    senderWallet.getBalance(),
                    (receiverUser != null ? receiverUser.getFullName() : "User #" + request.getReceiverUserId())
            );
        }

        log.info("💳 [RAZORPAY TRANSFER] Successfully transferred ₹{} to user {} - Ref: {}",
                request.getAmount(), request.getReceiverUserId(), ref);

        return Map.of(
                "success", true,
                "message", "Payment processed via Razorpay and transferred to beneficiary successfully",
                "referenceNumber", ref,
                "amount", request.getAmount(),
                "receiverUserId", request.getReceiverUserId()
        );
    }
}
