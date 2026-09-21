package com.paywallet.app.controller;

import com.paywallet.app.dto.TransactionResponse;
import com.paywallet.app.dto.TransferRequest;
import com.paywallet.app.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Fund transfer and transaction history endpoints.
 */
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    /**
     * Transfers funds between two users' wallets.
     *
     * @param request validated transfer payload (senderUserId, receiverUserId, amount)
     * @return 200 OK with a success message and the transaction details
     */
    @PostMapping("/transfer")
    public ResponseEntity<Map<String, Object>> transfer(@Valid @RequestBody TransferRequest request) {
        TransactionResponse txn = transactionService.transferFundsByUserId(
                request.getSenderUserId(),
                request.getReceiverUserId(),
                request.getAmount()
        );

        Map<String, Object> body = new HashMap<>();
        body.put("message", "Transfer successful");
        body.put("transaction", txn);
        return ResponseEntity.ok(body);
    }

    /**
     * Returns the transaction history for a given user.
     *
     * @param userId the user's ID
     * @return 200 OK with a list of transactions
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionResponse>> getTransactionsByUserId(@PathVariable Long userId) {
        List<TransactionResponse> history = transactionService.getTransactionsByUserId(userId);
        return ResponseEntity.ok(history);
    }
}

