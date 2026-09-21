package com.paywallet.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO exposing transaction details.
 * Amount is represented as {@link BigDecimal} — never a floating-point type.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private Long id;
    private Long senderWalletId;
    private Long receiverWalletId;
    private BigDecimal amount;
    private String transactionType;
    private String status;
    private String referenceNumber;
    private LocalDateTime createdAt;
}

